// src/app/api/social/youtube/initiate-upload/route.js

import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, description, fileSize, fileType } = await req.json();

        if (!title || !fileSize || !fileType) {
            return NextResponse.json({ error: 'Missing required parameters from frontend: title, fileSize, fileType' }, { status: 400 });
        }

        const [rows] = await db.query(
            'SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'youtube']
        );

        if (rows.length === 0 || !rows[0].refresh_token_encrypted) {
            return NextResponse.json({ error: 'YouTube account not connected or refresh token is missing in the database.' }, { status: 404 });
        }

        const refreshToken = decrypt(rows[0].refresh_token_encrypted);
        
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { token: accessToken } = await oauth2Client.getAccessToken();

        if (!accessToken) {
            throw new Error('Failed to retrieve a new access token using the refresh token.');
        }
        
        const videoMetadata = {
            snippet: { title, description },
            status: { privacyStatus: 'private' },
        };

        const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Upload-Content-Type': fileType,
                'X-Upload-Content-Length': fileSize.toString(),
            },
            body: JSON.stringify(videoMetadata),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Detailed Google API Error:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.error?.message || `Google API responded with status ${response.status}`);
        }
        
        const uploadUrl = response.headers.get('Location');
        
        if (!uploadUrl) {
            throw new Error('Could not get YouTube upload URL from Google\'s response headers.');
        }

        return NextResponse.json({ uploadUrl: uploadUrl });

    } catch (error) {
        // --- IMPROVED LOGGING ---
        // This will now log the full error object to your server console
        console.error('CRITICAL ERROR in initiate-upload endpoint:', error);
        
        // We also check if error.message exists to provide a more useful response
        const errorMessage = error.message || 'An unknown server error occurred.';
        
        return NextResponse.json({ error: `Failed to initialize upload. Reason: ${errorMessage}` }, { status: 500 });
    }
}