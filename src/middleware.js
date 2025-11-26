// src/middleware.js
export const runtime = 'nodejs'; 

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtVerify } from 'jose';
import { getUserSubscription } from '@/lib/userSubscription';
import { getPlanDetails } from '@/lib/plans';

// --- Feature Mappings ---
const PATH_REQUIREMENTS = {
    // ... (keep your existing mappings)
    '/social': { limitKey: 'maxSocialConnections', minRequired: 1 },
    '/settings/integrations': { limitKey: 'maxPlatformIntegrations', minRequired: 1 },
    '/settings/platforms': { limitKey: 'maxPlatformIntegrations', minRequired: 1 },
    '/analytics/google': { limitKey: 'googleAnalytics', minRequired: true },
    '/experiments': { limitKey: 'abTesting', minRequired: true },
    '/heatmaps': { limitKey: 'maxHeatmaps', minRequired: 1 },
    '/recommendations': { limitKey: 'recommendationWidgets', minRequired: true },
    '/reports': { limitKey: 'maxReports', minRequired: true },
    '/support/support-tickets': { limitKey: 'supportTickets', minRequired: true},
};

const getAdminSecret = () => {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) throw new Error("JWT_ADMIN_SECRET is not set.");
    return new TextEncoder().encode(secret);
};

export async function middleware(req) {
    const { pathname } = req.nextUrl;
    const appUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

    // --- 1. GLOBAL EXCLUSIONS (Fix for your issue) ---
    // Explicitly allow these paths to bypass all checks
    const publicPaths = ['/login', '/registration', '/verify-email', '/subscribe', '/api/register', '/api/verify-token'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // --- 2. Admin Check ---
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        // ... (keep existing admin logic)
        const adminCookie = req.cookies.get('admin-session-token');
        if (!adminCookie) return NextResponse.redirect(new URL('/admin/login', appUrl));
        try {
            const { payload } = await jwtVerify(adminCookie.value, getAdminSecret());
            if (payload.role !== 'superadmin') throw new Error('Not superadmin');
            return NextResponse.next();
        } catch (e) {
            return NextResponse.redirect(new URL('/admin/login?error=InvalidToken', appUrl));
        }
    }

    // --- 3. Feature Check ---
    const requirement = Object.entries(PATH_REQUIREMENTS).find(([path]) => pathname.startsWith(path))?.[1];

    if (requirement) {
        const sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        
        // If user is not logged in, redirect to login
        if (!sessionToken?.email) {
            const loginUrl = new URL('/login', appUrl);
            loginUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(loginUrl);
        }

        // ... (keep existing plan check logic)
        const priceId = sessionToken.stripePriceId;
        const status = sessionToken.stripeSubscriptionStatus;
        const isActive = status === 'active' || status === 'trialing';

        let plan;
        if (priceId && isActive) {
            plan = getPlanDetails(priceId);
        } else {
            plan = getPlanDetails(null);
        }

        const limit = plan.limits[requirement.limitKey];
        let hasAccess = false;

        if (typeof requirement.minRequired === 'boolean') {
            const isTruthy = !!limit || limit === Number.POSITIVE_INFINITY;
            hasAccess = isTruthy === requirement.minRequired;
        } else if (typeof limit === 'number') {
            hasAccess = limit >= requirement.minRequired;
        }

        if (!hasAccess) {
            const url = new URL('/upgrade-plans', appUrl);
            url.searchParams.set('reason', isActive ? 'limit' : 'inactive_or_free');
            url.searchParams.set('feature', requirement.limitKey);
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

// Simplified Matcher (Let the function handle exclusions)
export const config = {
    matcher: [
        // Match everything EXCEPT static files and images
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};