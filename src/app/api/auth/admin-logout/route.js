// File: src/app/api/auth/admin-logout/route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // Get the URL of the admin login page
        const loginUrl = new URL('/admin/login', request.url);
        
        // Create a response that redirects to the login page
        const response = NextResponse.redirect(loginUrl);
        
        // IMPORTANT: Delete the admin session cookie
        response.cookies.delete('admin-session-token');

        return response;
    } catch (error) {
        console.error("Admin logout error:", error);
        // Fallback redirect in case of an error
        return NextResponse.redirect(new URL('/', request.url));
    }
}