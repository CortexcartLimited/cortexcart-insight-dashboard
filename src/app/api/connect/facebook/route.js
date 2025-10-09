// src/app/api/connect/facebook/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';


export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // This dynamically creates the correct callback URL for development or production.
    const redirectUri = `${process.env.NEXTAUTH_URL}/connect/callback/facebook`;

    const scopes = [
        'email',
        'public_profile',
        'pages_show_list',
        'read_insights',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_basic',
        'instagram_manage_insights',
    ];

    const state = JSON.stringify({
        user_email: session.user.email,
        // Add any other state parameters you need here
    });

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${scopes.join(',')}&response_type=code`;
    
    return NextResponse.redirect(authUrl);
}