// src/middleware.js

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtVerify } from 'jose';
import { getUserSubscription } from '@/lib/userSubscription'; // Import your DB function
import { getPlanDetails } from '@/lib/plans'; // Import plan definitions and helper

// --- Define Feature-to-Path Mappings ---
// Map URL paths to the specific limit key in your PLANS object they require.
// Use minimum required value (e.g., 1 for boolean features, or actual count)
const PATH_REQUIREMENTS = {
    // Social Features
    '/social': { limitKey: 'maxSocialConnections', minRequired: 1 },

    // Platform Integration Settings
    '/settings/integrations': { limitKey: 'maxPlatformIntegrations', minRequired: 1 },
    '/settings/platforms': { limitKey: 'maxPlatformIntegrations', minRequired: 1 }, // Also likely requires integrations

    // GA Related pages
    '/analytics/google': { limitKey: 'googleAnalytics', minRequired: true }, // Assuming '/analytics/google' exists

    // A/B Testing
    '/experiments': { limitKey: 'abTesting', minRequired: true },

    // Heatmaps (Example path, adjust if needed)
    '/heatmaps/:path*': { limitKey: 'maxHeatmaps', minRequired: 1 },

    // Recommendations (Example path, adjust if needed)
    '/recommendations': { limitKey: 'recommendationWidgets', minRequired: true },

    // Reports (Example path, adjust if needed)
    // '/reports': { limitKey: 'maxReports', minRequired: 1 }, // Basic report access
    // '/reports/custom-algo': { limitKey: 'customRecommendationAlgorithms', minRequired: 1 },
    // '/reports/revenue-attribution': { limitKey: 'revenueAttributionModels', minRequired: 1 },

    // Custom AI (Example path, adjust if needed)
    // '/ai/custom-feature': { limitKey: 'customAiFeatures', minRequired: 1 },

    // Add mappings for all features controlled by plan limits...
};

// Helper function to get the ADMIN JWT secret (Keep this as is)
const getAdminSecret = () => {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) {
        throw new Error("JWT_ADMIN_SECRET is not set in environment variables.");
    }
    return new TextEncoder().encode(secret);
};

export async function middleware(req) {
    const { pathname } = req.nextUrl;
    const appUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin; // Ensure base URL is set

    // --- 1. Admin Route Protection (Keep this block first) ---
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        const adminCookie = req.cookies.get('admin-session-token');
        const adminToken = adminCookie?.value;

        if (!adminToken) {
            return NextResponse.redirect(new URL('/admin/login', appUrl));
        }

        try {
            const adminSecret = getAdminSecret();
            const { payload } = await jwtVerify(adminToken, adminSecret);

            if (payload.role !== 'superadmin') {
                return NextResponse.redirect(new URL('/admin/login?error=Forbidden', appUrl));
            }
            // Superadmin logged in, allow access to admin routes
            return NextResponse.next();
        } catch (error) {
            console.error('Admin token verification failed:', error.message);
            return NextResponse.redirect(new URL('/admin/login?error=InvalidToken', appUrl));
        }
    }

    // --- 2. Regular User Authentication Check for Protected Routes ---
    // Define all routes that require *at least* a logged-in user
    const requiresAuthPaths = [
        '/dashboard', '/settings', '/account', '/billing-settings', '/my-plan',
        '/social', '/experiments', '/heatmaps', '/recommendations', '/reports',
        '/analytics', '/products', '/support', '/roadmap', // Add other sections needing login
        // Add paths from PATH_REQUIREMENTS if not already covered
    ];

    const requiresAuth = requiresAuthPaths.some(prefix => pathname.startsWith(prefix));

    let sessionToken = null; // Declare sessionToken here to use later
    if (requiresAuth) {
        sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!sessionToken?.email) {
            console.log(`Middleware: Authentication required for ${pathname}, redirecting to login.`);
            const loginUrl = new URL('/login', appUrl); // Use regular user login
            loginUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(loginUrl);
        }
        // User is authenticated, proceed to plan checks if necessary
    }

    // --- 3. Plan Limit Checks for Specific User Routes ---
    // Find if the current path requires a plan feature check
    const requirement = Object.entries(PATH_REQUIREMENTS).find(([pathPrefix]) =>
        pathname.startsWith(pathPrefix)
    )?.[1]; // Get the requirement object { limitKey, minRequired }

    // If a plan requirement exists for this path...
    if (requirement) {
        // We should already have the sessionToken from the auth check above
        if (!sessionToken?.email) {
            // This should ideally not happen if requiresAuthPaths covers PATH_REQUIREMENTS, but acts as a safeguard
            console.error(`Middleware: Plan check needed for ${pathname}, but no valid session token found.`);
            const loginUrl = new URL('/login', appUrl);
            loginUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(loginUrl);
        }

        try {
            const subscription = await getUserSubscription(sessionToken.email); // Fetch from your DB

            // Use 'active' and 'trialing' as valid statuses
            const isActiveSub = subscription?.stripeSubscriptionStatus === 'active' || subscription?.stripeSubscriptionStatus === 'trialing';

            let planDetails;
            // Get plan details based on whether the subscription is active/found
            if (subscription && isActiveSub) {
                planDetails = getPlanDetails(subscription.stripePriceId);
            } else {
                console.log(`Middleware: User ${sessionToken.email} accessing ${pathname}. No active subscription found (Status: ${subscription?.stripeSubscriptionStatus}). Applying default plan limits.`);
                planDetails = getPlanDetails(null); // Get the default/fallback plan limits
            }

            const userLimit = planDetails.limits[requirement.limitKey]; // e.g., planDetails.limits['maxSocialConnections']

            // Check if the user's limit meets the minimum requirement
            let hasAccess = false;
            if (typeof requirement.minRequired === 'boolean') {
                hasAccess = userLimit === requirement.minRequired; // Check boolean features
            } else if (typeof userLimit === 'number') {
                hasAccess = userLimit >= requirement.minRequired; // Check numeric features
            }

            if (!hasAccess) {
                console.log(`Access denied for ${sessionToken.email} to ${pathname}: Feature "${requirement.limitKey}" limit not met (Plan: ${planDetails.id}, User limit: ${userLimit}, Required: ${requirement.minRequired})`);
                // Redirect to upgrade page
                const upgradeUrl = new URL('/upgrade-plans', appUrl); // Ensure this is your correct upgrade page URL
                upgradeUrl.searchParams.set('reason', subscription && isActiveSub ? 'limit' : 'inactive_or_free');
                upgradeUrl.searchParams.set('feature', requirement.limitKey); // Optionally pass the feature name
                return NextResponse.redirect(upgradeUrl);
            }

            // Plan limit check passed
            console.log(`Middleware: Access granted for ${sessionToken.email} to ${pathname}. Plan: ${planDetails.id}, Feature: ${requirement.limitKey}`);
            return NextResponse.next();

        } catch (error) {
            console.error("Middleware error checking plan limits:", error);
            // Fallback: Redirect to dashboard with error or show generic error page
            return NextResponse.redirect(new URL('/dashboard?error=middleware_plan_check', appUrl));
        }
    }

    // --- 4. Allow Access if No Specific Checks Failed ---
    // If it's not an admin route, and either doesn't require auth,
    // or auth passed and no specific plan limit check was required/failed, allow access.
    return NextResponse.next();
}

// --- Configure Middleware Paths ---
// Update matcher to include ALL paths needing protection (auth OR plan limits)
// AND exclude public assets, API routes, auth pages, upgrade page, etc.
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (login page)
         * - registration (registration page)
         * - subscribe (subscription initiation page - if public)
         * - upgrade-plans (upgrade page itself)
         * - pages (your static info pages like privacy, terms etc.)
         * - admin/login (admin login page)
         * - connect/callback routes (OAuth callbacks)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|login|registration|subscribe|upgrade-plans|pages|admin/login|connect/callback).*)',
        // Explicitly include admin routes again just to be safe, though covered above
        '/admin/:path*',
    ],
};