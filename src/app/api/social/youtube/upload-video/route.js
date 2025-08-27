import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { Readable } from 'stream';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const videoFile = formData.get('video');
        const thumbnailFile = formData.get('thumbnail');
        const title = formData.get('title');
        const description = formData.get('description');
        const privacyStatus = formData.get('privacyStatus');

        if (!videoFile || !title) {
            return NextResponse.json({ error: 'Missing required video file or title.' }, { status: 400 });
        }

        // --- Get YouTube Tokens from Database ---
        const [rows] = await db.query('SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?', [session.user.email, 'youtube']);
        if (rows.length === 0 || !rows[0].refresh_token_encrypted) {
            return NextResponse.json({ error: 'YouTube account not connected.' }, { status: 404 });
        }
        const refreshToken = decrypt(rows[0].refresh_token_encrypted);

        // --- Authenticate with Google ---
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID, 
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        await oauth2Client.getAccessToken(); // Refresh the access token

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client,
        });

        // --- 1. Upload the Video ---
        const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        const videoStream = new Readable();
        videoStream.push(videoBuffer);
        videoStream.push(null);

        const videoResponse = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title,
                    description,
                },
                status: {
                    privacyStatus: privacyStatus || 'private',
                },
            },
            media: {
                body: videoStream,
            },
        });

        const videoId = videoResponse.data.id;
        if (!videoId) {
            throw new Error('Video upload to YouTube failed.');
        }

        // --- 2. Set the Thumbnail (if provided) ---
        if (thumbnailFile) {
            const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
            const thumbnailStream = new Readable();
            thumbnailStream.push(thumbnailBuffer);
            thumbnailStream.push(null);
            
            await youtube.thumbnails.set({
                videoId: videoId,
                media: {
                    mimeType: thumbnailFile.type,
                    body: thumbnailStream,
                },
            });
        }

        return NextResponse.json({ message: 'Video and thumbnail uploaded successfully!', videoId }, { status: 200 });

    } catch (error) {
        console.error("CRITICAL Error in upload-video:", error.message);
        return NextResponse.json({ error: 'Failed to upload to YouTube.' }, { status: 500 });
    }
}