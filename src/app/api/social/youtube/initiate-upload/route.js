// src/app/api/social/youtube/initiate-upload/route.js

import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { title, description, fileSize, fileType } = await req.json();
        if (!title || !fileSize || !fileType) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Get fresh access token
        const [rows] = await db.query('SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?', [session.user.email, 'youtube']);
        if (rows.length === 0 || !rows[0].refresh_token_encrypted) {
            return NextResponse.json({ error: 'YouTube account not connected.' }, { status: 404 });
        }
        const refreshToken = decrypt(rows[0].refresh_token_encrypted);
        const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { token: accessToken } = await oauth2Client.getAccessToken();

        if (!accessToken) {
            throw new Error('Failed to retrieve access token.');
        }

        // --- THE FIX: Use a direct fetch call for more control ---
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
            throw new Error(errorData.error?.message || `Google API responded with status ${response.status}`);
        }
        
        const uploadUrl = response.headers.get('Location');
        // The video ID is not in the response body for this request, it comes after the PUT upload
        // We will need to adjust the frontend to handle this.
        
        if (!uploadUrl) {
            throw new Error('Could not get YouTube upload URL from Google\'s response headers.');
        }

        return NextResponse.json({ uploadUrl });

    } catch (error) {
        console.error("CRITICAL Error in initiate-upload:", error.message);
        return NextResponse.json({ error: 'Failed to initiate YouTube upload.' }, { status: 500 });
    }
}