import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function GET(request) {
    const redirectUri = 'http://localhost:3000/connect/callback/youtube';
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.redirect(new URL('/settings?connect_status=error&message=User_not_authenticated', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const cookieStore = cookies();
    const originalState = cookieStore.get('youtube_oauth_state')?.value;
    cookieStore.delete('youtube_oauth_state');

    const settingsUrl = new URL('/settings', request.url);

    if (!code || !state || state !== originalState) {
        settingsUrl.searchParams.set('connect_status', 'error');
        settingsUrl.searchParams.set('message', 'Authentication failed. State mismatch.');
        return NextResponse.redirect(settingsUrl);
    }

    const connection = await db.getConnection();
    
    // --- Define the redirect URI once and reuse it ---
    //const redirectUri = `${process.env.NEXTAUTH_URL}/connect/callback/youtube`;

    try {
        await connection.beginTransaction();

        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET
            // Note: We leave the redirect URI out of the initial constructor
        );

        // --- THE FIX ---
        // Explicitly pass the code AND redirect_uri to the getToken method.
        const { tokens } = await oauth2Client.getToken({
            code: code,
            redirect_uri: redirectUri
        });

        const { access_token, refresh_token, expiry_date } = tokens;

        if (!refresh_token) {
            throw new Error('A refresh token was not provided by Google. Please disconnect and reconnect your account.');
        }

        oauth2Client.setCredentials(tokens);

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const channelResponse = await youtube.channels.list({
            mine: true,
            part: 'snippet,id'
        });
        
        const channel = channelResponse.data.items[0];
        if (!channel) throw new Error('Could not find a YouTube channel for this account.');

        const channelId = channel.id;
        const channelName = channel.snippet.title;

        // ... rest of the database logic remains the same ...
        await connection.query(
            `INSERT INTO youtube_channels (user_email, channel_id, channel_name, access_token_encrypted, refresh_token_encrypted, expires_at)
             VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE channel_name = VALUES(channel_name), access_token_encrypted = VALUES(access_token_encrypted), refresh_token_encrypted = VALUES(refresh_token_encrypted), expires_at = VALUES(expires_at), updated_at = NOW();`,
            [session.user.email, channelId, channelName, encrypt(access_token), encrypt(refresh_token), new Date(expiry_date)]
        );
        
        await connection.query(
            `INSERT INTO social_connect (user_email, platform) VALUES (?, 'youtube') ON DUPLICATE KEY UPDATE platform = 'youtube';`,
            [session.user.email]
        );

        await connection.commit();

        settingsUrl.searchParams.set('connect_status', 'success');
        return NextResponse.redirect(settingsUrl);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error during YouTube OAuth callback:", error);
        
        // Improved error logging
        const errorMessage = error.response?.data?.error_description || error.message;
        settingsUrl.searchParams.set('message', errorMessage.replace(/ /g, '_'));
        settingsUrl.searchParams.set('connect_status', 'error');

        return NextResponse.redirect(settingsUrl);
    } finally {
        if (connection) connection.release();
    }
}