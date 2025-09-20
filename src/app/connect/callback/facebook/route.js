// src/app/connect/callback/facebook/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/settings?error=facebook_auth_failed', req.url));
    }

    try {
        // 1. Exchange the code for a long-lived access token
        const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token`;
        
        // Use URLSearchParams to correctly format the request body
        const tokenParams = new URLSearchParams({
            client_id: process.env.FACEBOOK_CLIENT_ID,
            redirect_uri: `${process.env.NEXTAUTH_URL}/connect/callback/facebook`,
            client_secret: process.env.FACEBOOK_CLIENT_SECRET,
            code: code,
        });

        // Use a POST request which is more standard for this type of exchange
        const tokenResponse = await axios.post(tokenUrl, tokenParams);
        const { access_token } = tokenResponse.data;

        if (!access_token) {
            throw new Error('Failed to retrieve access token from Facebook.');
        }

        // 2. Encrypt the token for database storage
        const encryptedAccessToken = encrypt(access_token);
        const userEmail = session.user.email;
        const platform = 'facebook';

        // 3. Save the connection to our single source of truth: 'social_connect'
        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
             access_token_encrypted = VALUES(access_token_encrypted),
             updated_at = NOW()`,
            [userEmail, platform, encryptedAccessToken]
        );

        // 4. Redirect to the settings page with a success message
        const successUrl = new URL('/settings/social-connections?connect_status=success', req.url);
        successUrl.searchParams.set('success', 'facebook_connected');
        return NextResponse.redirect(successUrl);

    } catch (error) {
        // Log the detailed error from Facebook's response if available
        console.error('Error during Facebook OAuth callback:', error.response ? error.response.data : error.message);
        const errorUrl = new URL('/settings/social-connections/', req.url);
        errorUrl.searchParams.set('error', 'facebook_connection_error');
        return NextResponse.redirect(errorUrl);
    }
}