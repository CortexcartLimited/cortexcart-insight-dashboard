// src/middleware.js

export const runtime = 'nodejs'; // Force Node.js runtime

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtVerify } from 'jose';
import { getUserSubscription } from '@/lib/userSubscription';
import { getPlanDetails } from '@/lib/plans';

// --- Define Feature-to-Path Mappings ---
const PATH_REQUIREMENTS = {
    // Social Features
    '/social': { limitKey: 'maxSocialConnections', minRequired: 1 },

    // Platform Integration Settings
    '/settings/integrations': { limitKey: 'maxPlatformIntegrations', minRequired: 1 },
    '/settings/platforms': { limitKey: 'maxPlatformIntegrations', minRequired: 1 },

    // GA Related pages
    '/analytics/google': { limitKey: 'googleAnalytics', minRequired: true },

    // A/B Testing
    '/experiments': { limitKey: 'abTesting', minRequired: true },

    // Heatmaps
    '/heatmaps': { limitKey: 'maxHeatmaps', minRequired: 1 },

    // Recommendations (Homepage AI)
    '/recommendations': { limitKey: 'recommendationWidgets', minRequired: true },

    // Reports (AI Performance Report)
    '/reports': { limitKey: 'maxReports', minRequired: true },

    // Support tickets
    // FIXED: Changed minRequired from false to true
    '/support/support-tickets': { limitKey: 'supportTickets', minRequired: true},
};

// Helper function to get the ADMIN JWT secret
const getAdminSecret = () => {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) {
        throw new Error("JWT_ADMIN_SECRET is not set in environment variables.");
    }
    return new TextEncoder().encode(secret);
};

export async function middleware(req) {
    const { pathname } = req.nextUrl;
    const appUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

    // --- 1. Admin Route Protection ---
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
            return NextResponse.next();
        } catch (error) {
            console.error('Admin token verification failed:', error.message);
            return NextResponse.redirect(new URL('/admin/login?error=InvalidToken', appUrl));
        }
    }

    // --- 2. Regular User Authentication Check ---
    const requiresAuthPaths = [
        '/dashboard', '/settings', '/account', '/billing-settings', '/my-plan',
        '/social', '/experiments', '/heatmaps', '/recommendations', '/reports',
        '/analytics', '/products', '/support', '/roadmap',
    ];

    const requiresAuth = requiresAuthPaths.some(prefix => pathname.startsWith(prefix));
    let sessionToken = null;

    if (requiresAuth) {
        sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!sessionToken?.email) {
            const loginUrl = new URL('/login', appUrl);
            loginUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    // --- 3. Plan Limit Checks ---
    const requirement = Object.entries(PATH_REQUIREMENTS).find(([pathPrefix]) =>
        pathname.startsWith(pathPrefix)
    )?.[1];

    if (requirement) {
        if (!sessionToken?.email) {
            const loginUrl = new URL('/login', appUrl);
            loginUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(loginUrl);
        }

        try {
            const subscription = await getUserSubscription(sessionToken.email);
            const isActiveSub = subscription?.stripeSubscriptionStatus === 'active' || subscription?.stripeSubscriptionStatus === 'trialing';
            
            let planDetails;
            if (subscription && isActiveSub) {
                planDetails = getPlanDetails(subscription.stripePriceId);
            } else {
                planDetails = getPlanDetails(null);
            }

            const userLimit = planDetails.limits[requirement.limitKey];

            // --- FIX: Smarter Logic for Numbers vs Booleans ---
            let hasAccess = false;

            if (typeof requirement.minRequired === 'boolean') {
                // If the requirement is a simple TRUE (e.g., "Access Allowed"):
                // We accept: true, any number > 0, or Infinity.
                const isTruthy = (userLimit === true) || (typeof userLimit === 'number' && userLimit > 0);
                hasAccess = isTruthy === requirement.minRequired;
            } else if (typeof userLimit === 'number') {
                // Standard number comparison (e.g., limit 5 >= required 1)
                hasAccess = userLimit >= requirement.minRequired;
            }

            if (!hasAccess) {
                console.log(`Access denied for ${sessionToken.email} to ${pathname}. Plan: ${planDetails.id}, Limit: ${userLimit}, Required: ${requirement.minRequired}`);
                const upgradeUrl = new URL('/upgrade-plans', appUrl);
                upgradeUrl.searchParams.set('reason', 'limit');
                upgradeUrl.searchParams.set('feature', requirement.limitKey);
                return NextResponse.redirect(upgradeUrl);
            }

            return NextResponse.next();
        } catch (error) {
            console.error("Middleware error checking plan limits:", error);
            return NextResponse.redirect(new URL('/dashboard?error=middleware_plan_check', appUrl));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|login|registration|subscribe|upgrade-plans|pages|admin/login|connect/callback).*)',
        '/admin/:path*',
    ],
};