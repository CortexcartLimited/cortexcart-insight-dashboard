// src/middleware.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtVerify } from 'jose';
import { getUserSubscription } from '@/lib/userSubscription';
import { getPlanDetails } from '@/lib/plans';

// --- Feature Mappings ---
const PATH_REQUIREMENTS = {
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

    // ==============================================================
    // 1. CRITICAL: EXPLICITLY ALLOW PUBLIC PATHS (Circuit Breaker)
    // ==============================================================
    // This runs before ANYTHING else to prevent redirect loops.
    const publicPaths = [
        '/login',
        '/registration',
        '/verify-email',
        '/api/auth',     // Important for NextAuth to work
        '/api/register', // Your registration API
        '/api/verify-token',
        '/favicon.ico',
        '/_next',        // Next.js system files
        '/static',        // Static assets
        '/api/webhooks', // Webhooks for meta
        '/api/crm/send-message' // send-message
    ];

    // If the path starts with any of these, stop and let it pass.
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // ==============================================================
    // 2. Admin Check
    // ==============================================================
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
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

    // ==============================================================
    // 3. Feature & Authentication Check
    // ==============================================================
    const requirement = Object.entries(PATH_REQUIREMENTS).find(([path]) => pathname.startsWith(path))?.[1];

    if (requirement) {
        const sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        // If user is not logged in, redirect to login
        if (!sessionToken?.email) {
            const loginUrl = new URL('/login', appUrl);
            // We add the callbackUrl so they go back to the right place after login
            loginUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(loginUrl);
        }

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

// --- SIMPLIFIED MATCHER ---
// We match essentially everything here, relying on the code above to filter.
// This prevents "matcher regex bugs" from accidentally blocking /login.
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};