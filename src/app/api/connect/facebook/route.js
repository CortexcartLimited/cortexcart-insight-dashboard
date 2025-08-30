// src/app/api/connect/facebook/route.js

import { NextResponse } from 'next/server';

export async function GET(req) {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/connect/callback/facebook`;
    
    // --- CORRECTED PERMISSION SCOPE ---
    const scope = [
        'public_profile',
        'email',
        'pages_show_list',      // Allows listing the user's pages
        'pages_read_engagement',// Allows reading page content and metrics
        'instagram_basic',      // Required for getting Instagram account info
        'instagram_content_publish' // CORRECT PERMISSION for publishing to Instagram
    ].join(',');

    const state = 'some-unique-state-string'; // It's a good practice to generate a unique and secure state for each auth request

    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;

    return NextResponse.redirect(facebookAuthUrl);
}