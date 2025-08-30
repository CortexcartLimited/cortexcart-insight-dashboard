// src/app/connect/callback/facebook/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import axios from 'axios';

export async function GET(req) {
    const cookieStore = cookies();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const storedState = cookieStore.get('facebook_oauth_state')?.value;

    // --- CRUCIAL SECURITY CHECK ---
    // 1. Clear the state cookie immediately to prevent reuse
    cookieStore.delete('facebook_oauth_state');

    // 2. Validate the state
    if (!state || !storedState || state !== storedState) {
        const errorUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        errorUrl.searchParams.set('connect_status', 'error');
        errorUrl.searchParams.set('message', 'State mismatch. Please try connecting again.');
        return NextResponse.redirect(errorUrl);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL));
    }

    try {
        const redirectUri = `${process.env.NEXTAUTH_URL}/connect/callback/facebook`;
        
        // Exchange code for an access token
        const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
                client_id: process.env.FACEBOOK_CLIENT_ID,
                client_secret: process.env.FACEBOOK_CLIENT_SECRET,
                redirect_uri: redirectUri,
                code: code,
            }
        });

        const { access_token, expires_in } = tokenResponse.data;

        // Save the encrypted token to the database
        const expires_at = new Date(Date.now() + expires_in * 1000);
        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted, expires_at) 
             VALUES (?, 'facebook', ?, ?)
             ON DUPLICATE KEY UPDATE 
                access_token_encrypted = VALUES(access_token_encrypted), 
                expires_at = VALUES(expires_at)`,
            [session.user.email, encrypt(access_token), expires_at]
        );

        const successUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        successUrl.searchParams.set('connect_status', 'success');
        successUrl.searchParams.set('platform', 'facebook');
        return NextResponse.redirect(successUrl);

    } catch (error) {
        console.error("Facebook callback error:", error.response ? error.response.data : error.message);
        const errorUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        errorUrl.searchParams.set('connect_status', 'error');
        errorUrl.searchParams.set('message', 'Failed to connect Facebook account.');
        return NextResponse.redirect(errorUrl);
    }
}