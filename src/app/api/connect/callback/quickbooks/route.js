// src/app/api/connect/callback/quickbooks/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import base64 from 'base-64';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.redirect('/?error=NotAuthenticated');
    }

    // --- NEW: Get the base URL from environment variables ---
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const realmId = searchParams.get('realmId');

    if (!code || !realmId) {
        // --- UPDATED: Use absolute URL for the redirect ---
        return NextResponse.redirect(`${baseUrl}/?error=QuickBooksAuthFailed`);
    }

    try {
        // ... (The token exchange logic remains the same, as it was successful)
        const clientId = process.env.QUICKBOOKS_CLIENT_ID;
        const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
        const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
        const authHeader = base64.encode(`${clientId}:${clientSecret}`);
        const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
        });
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authHeader}`,
                'Accept': 'application/json',
            },
            body: body.toString(),
        });
        const tokenData = await response.json();
        if (!response.ok) {
            throw new Error(tokenData.error_description || 'Token exchange failed');
        }
        const accessTokenEncrypted = encrypt(tokenData.access_token);
        const refreshTokenEncrypted = encrypt(tokenData.refresh_token);
        await db.query(
            `
            INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, realm_id)
            VALUES (?, 'quickbooks', ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            access_token_encrypted = VALUES(access_token_encrypted),
            refresh_token_encrypted = VALUES(refresh_token_encrypted),
            realm_id = VALUES(realm_id);
            `,
            [session.user.email, accessTokenEncrypted, refreshTokenEncrypted, realmId]
        );

        // --- UPDATED: Use absolute URL for the redirect ---
        return NextResponse.redirect(`${baseUrl}/settings#platforms?success=QuickBooksConnected`);

    } catch (error) {
        console.error('--- [QB Callback] CRITICAL ERROR in try-catch block:', error);
        // --- UPDATED: Use absolute URL for the redirect ---
        return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error.message)}`);
    }
}