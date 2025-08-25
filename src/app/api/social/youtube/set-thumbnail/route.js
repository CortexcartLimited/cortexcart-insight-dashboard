// src/app/api/social/youtube/set-thumbnail/route.js

import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, imageUrl } = await req.json();

    if (!videoId || !imageUrl) {
        return NextResponse.json({ error: 'Missing videoId or imageUrl' }, { status: 400 });
    }

    let oauth2Client;

    try {
        // --- Step 1: Get a fresh Access Token ---
        const [rows] = await db.query(
            'SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'youtube']
        );

        if (rows.length === 0 || !rows[0].refresh_token_encrypted) {
            throw new Error('YouTube account not connected or refresh token is missing.');
        }

        const refreshToken = decrypt(rows[0].refresh_token_encrypted);
        
        oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        await oauth2Client.getAccessToken();

    } catch (error) {
        console.error("THUMBNAIL ERROR (Step 1 - Auth):", error.message);
        return NextResponse.json({ error: 'Failed to authenticate with Google.' }, { status: 500 });
    }

    let imageBuffer;
    let imageMimeType;

    try {
        // --- Step 2: Download the image ---
        const absoluteImageUrl = new URL(imageUrl, process.env.NEXTAUTH_URL).href;
        console.log(`THUMBNAIL LOG: Attempting to download image from ${absoluteImageUrl}`);
        
        const imageResponse = await axios.get(absoluteImageUrl, {
            responseType: 'arraybuffer'
        });
        
        imageBuffer = Buffer.from(imageResponse.data, 'binary');
        imageMimeType = imageResponse.headers['content-type'];
        console.log(`THUMBNAIL LOG: Image downloaded successfully. Size: ${imageBuffer.length} bytes. Type: ${imageMimeType}`);

    } catch (error) {
        console.error("THUMBNAIL ERROR (Step 2 - Image Download):", error.message);
        return NextResponse.json({ error: 'Failed to download the thumbnail image from the server.' }, { status: 500 });
    }

    try {
        // --- Step 3: Upload the thumbnail to YouTube ---
        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });
        
        console.log(`THUMBNAIL LOG: Attempting to upload thumbnail for video ID: ${videoId}`);
        await youtube.thumbnails.set({
            videoId: videoId,
            media: {
                mimeType: imageMimeType,
                body: imageBuffer,
            },
        });
        
        console.log("THUMBNAIL LOG: Thumbnail uploaded successfully to YouTube.");
        return NextResponse.json({ success: true, message: 'Thumbnail updated successfully.' });

    } catch (error) {
        console.error("THUMBNAIL ERROR (Step 3 - YouTube Upload):", error.response ? error.response.data : error.message);
        return NextResponse.json({ error: 'Failed to upload the thumbnail to YouTube.' }, { status: 500 });
    }
}