// src/middleware.js (Corrected)

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtVerify } from 'jose';

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
    const appUrl = process.env.NEXTAUTH_URL;

    // --- Admin Route Protection ---
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

    // --- Regular User Route Protection ---
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings') || pathname.startsWith('/subscribe')) {
        // getToken from next-auth uses the raw secret string directly
        const sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!sessionToken) {
            const signInUrl = new URL('/api/auth/signin', appUrl);
            signInUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(signInUrl);
        }
    }

    return NextResponse.next();
}

// Config to specify which paths the middleware should run on
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/settings/:path*',
        '/subscribe/:path*',
        '/admin/:path*',
    ],
};