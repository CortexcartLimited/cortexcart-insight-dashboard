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

    // 1. Admin Check
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

    // 2. Feature Check
    const requirement = Object.entries(PATH_REQUIREMENTS).find(([path]) => pathname.startsWith(path))?.[1];

    if (requirement) {
        const sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!sessionToken?.email) {
            const loginUrl = new URL('/login', appUrl);
            loginUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(loginUrl);
        }

        try {
            const sub = await getUserSubscription(sessionToken.email);
            const isActive = sub?.stripeSubscriptionStatus === 'active' || sub?.stripeSubscriptionStatus === 'trialing';
            
            // --- DEEP DEBUG LOGGING ---
            console.log(`\n--- MIDDLEWARE CHECK: ${pathname} ---`);
            console.log(`User: ${sessionToken.email}`);
            console.log(`DB Price ID: '${sub?.stripePriceId}'`); // Quotes help see hidden spaces
            console.log(`Is Active?: ${isActive}`);
            
            let plan;
            if (sub && isActive) {
                plan = getPlanDetails(sub.stripePriceId);
            } else {
                plan = getPlanDetails(null);
            }
            
            console.log(`Resolved Plan Name: '${plan.name}' (ID: ${plan.id})`);
            console.log(`Required Feature: ${requirement.limitKey}`);
            console.log(`Plan Limit Value: ${plan.limits[requirement.limitKey]}`);
            // --------------------------

            const limit = plan.limits[requirement.limitKey];
            let hasAccess = false;

            if (typeof requirement.minRequired === 'boolean') {
                const isTruthy = !!limit || limit === Number.POSITIVE_INFINITY;
                hasAccess = isTruthy === requirement.minRequired;
            } else if (typeof limit === 'number') {
                hasAccess = limit >= requirement.minRequired;
            }

            if (!hasAccess) {
                console.log(`!!! ACCESS DENIED !!! Redirecting.`);
                const url = new URL('/upgrade-plans', appUrl);
                url.searchParams.set('reason', isActive ? 'limit' : 'inactive_or_free');
                url.searchParams.set('feature', requirement.limitKey);
                return NextResponse.redirect(url);
            }
        } catch (error) {
            console.error("Middleware Error:", error);
            return NextResponse.redirect(new URL('/dashboard?error=middleware_error', appUrl));
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