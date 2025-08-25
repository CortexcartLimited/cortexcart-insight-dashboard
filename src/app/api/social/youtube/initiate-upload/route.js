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

        // Initiate resumable upload with Google
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const videoResource = {
            snippet: { title, description },
            status: { privacyStatus: 'private' },
        };
        
        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: videoResource,
            media: {
                body: req.body, // This is just for the API call structure, not the actual file
            }
        }, {
             // This is the key part to get the resumable upload URL
            headers: {
                'X-Upload-Content-Type': fileType,
                'X-Upload-Content-Length': fileSize
            }
        });
        
        const uploadUrl = response.headers.location;
        const videoId = response.data.id; // The video ID is available in this initial response

        if (!uploadUrl || !videoId) {
            throw new Error('Failed to get upload URL or Video ID from Google.');
        }

        // Return BOTH the upload URL and the new Video ID
        return NextResponse.json({ uploadUrl, videoId });

    } catch (error) {
        console.error("CRITICAL Error in initiate-upload:", error.response ? error.response.data.error : error.message);
        return NextResponse.json({ error: 'Failed to initiate YouTube upload.' }, { status: 500 });
    }
}