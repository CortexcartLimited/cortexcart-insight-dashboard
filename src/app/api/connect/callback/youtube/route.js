import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.redirect('/login');
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        const errorRedirectUrl = new URL('/settings/social-connections/', process.env.NEXTAUTH_URL);
        errorRedirectUrl.searchParams.set('error', 'YouTube connection failed: Authorization code not found.');
        return NextResponse.redirect(errorRedirectUrl);
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXTAUTH_URL}/api/connect/callback/youtube`
        );

        const { tokens } = await oauth2Client.getToken(code);
        
        // Encrypt both the refresh and access tokens
        const encryptedRefreshToken = encrypt(tokens.refresh_token);
        const encryptedAccessToken = encrypt(tokens.access_token);

        // --- THE FIX ---
        // Correctly match the column names from your prisma schema:
        // 'access_token' is now 'access_token_encrypted'
        // 'expiry_date' is now 'expires_at'
        await db.query(
            `INSERT INTO social_connect (user_email, platform, refresh_token_encrypted, access_token_encrypted, expires_at)
             VALUES (?, 'youtube', ?, ?, FROM_UNIXTIME(? / 1000))
             ON DUPLICATE KEY UPDATE
             refresh_token_encrypted = VALUES(refresh_token_encrypted),
             access_token_encrypted = VALUES(access_token_encrypted),
             expires_at = VALUES(expires_at)`,
            [session.user.email, encryptedRefreshToken, encryptedAccessToken, tokens.expiry_date]
        );

        const successRedirectUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        successRedirectUrl.searchParams.set('success', 'true');
        successRedirectUrl.searchParams.set('platform', 'youtube');
        
        return NextResponse.redirect(successRedirectUrl);

    } catch (error) {
        console.error('Error during YouTube OAuth callback:', error);
        const errorRedirectUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        errorRedirectUrl.searchParams.set('error', 'Failed to connect YouTube account.');
        return NextResponse.redirect(errorRedirectUrl);
    }
}