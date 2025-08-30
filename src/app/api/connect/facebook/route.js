// src/app/api/connect/facebook/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export async function GET() {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/connect/callback/facebook`;
    
    const state = randomBytes(16).toString('hex');

    cookies().set('facebook_oauth_state', state, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: 'lax',
    });

    // --- FINAL PERMISSION SCOPE ---
    const scope = [
        'public_profile',
        'email',
        'pages_show_list',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
        'business_management' // Added this crucial permission
    ].join(',');

    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;

    return NextResponse.redirect(facebookAuthUrl);
}