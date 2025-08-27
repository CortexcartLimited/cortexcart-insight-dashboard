import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto'; // Using the new encrypt function

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        // Not authorized
        return NextResponse.redirect('/login');
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        // Handle error if no code is provided
        const errorRedirectUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        errorRedirectUrl.searchParams.set('error', 'YouTube connection failed: Authorization code not found.');
        return NextResponse.redirect(errorRedirectUrl);
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            // This redirect URI must EXACTLY match the one in your Google Cloud Console
            `${process.env.NEXTAUTH_URL}/api/connect/callback/youtube`
        );

        const { tokens } = await oauth2Client.getToken(code);
        
        // Encrypt the refresh token before storing it
        const encryptedRefreshToken = encrypt(tokens.refresh_token);

        // Store the encrypted refresh token in the database
        await db.query(
            `INSERT INTO social_connect (user_email, platform, refresh_token_encrypted, access_token, expiry_date)
             VALUES (?, 'youtube', ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             refresh_token_encrypted = VALUES(refresh_token_encrypted),
             access_token = VALUES(access_token),
             expiry_date = VALUES(expiry_date)`,
            [session.user.email, encryptedRefreshToken, tokens.access_token, tokens.expiry_date]
        );

        // --- THE FIX ---
        // Dynamically create the success URL using the environment variable
        const successRedirectUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        successRedirectUrl.searchParams.set('success', 'true');
        successRedirectUrl.searchParams.set('platform', 'youtube');
        
        return NextResponse.redirect(successRedirectUrl);

    } catch (error) {
        console.error('Error during YouTube OAuth callback:', error);
        // Also use the environment variable for the error redirect
        const errorRedirectUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        errorRedirectUrl.searchParams.set('error', 'Failed to connect YouTube account.');
        return NextResponse.redirect(errorRedirectUrl);
    }
}