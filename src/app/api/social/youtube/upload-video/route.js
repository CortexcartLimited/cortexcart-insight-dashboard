// src/app/api/social/youtube/upload-video/route.js
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { Readable } from 'stream';

export async function POST(req) {
    let userEmail;
    
    try {
        const internalAuthToken = req.headers.get('authorization');
        const contentType = req.headers.get('content-type');

        // --- START OF FIX: DUAL AUTHENTICATION & DATA HANDLING ---
        if (internalAuthToken === `Bearer ${process.env.INTERNAL_API_SECRET}`) {
            // This is an authorized internal call from the cron job
            const body = await req.json();
            if (!body.user_email) {
                return NextResponse.json({ error: 'user_email is required for cron job posts' }, { status: 400 });
            }
            userEmail = body.user_email;
            
            // The cron job sends URLs, so we'll fetch them
            const { title, content: description, videoUrl, imageUrl, privacyStatus } = body;

            if (!videoUrl || !title) {
                return NextResponse.json({ error: 'Missing required video URL or title.' }, { status: 400 });
            }

            // Fetch video from URL
            const videoResponse = await fetch(new URL(videoUrl, process.env.NEXT_PUBLIC_APP_URL).href);
            if (!videoResponse.ok) throw new Error('Failed to fetch video from URL');
            const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

            // Fetch thumbnail from URL (if it exists)
            let thumbnailBuffer = null;
            if (imageUrl) {
                const thumbResponse = await fetch(new URL(imageUrl, process.env.NEXT_PUBLIC_APP_URL).href);
                if (thumbResponse.ok) {
                    thumbnailBuffer = Buffer.from(await thumbResponse.arrayBuffer());
                }
            }
            
            return await uploadToYouTube({ userEmail, title, description, privacyStatus, videoBuffer, thumbnailBuffer });

        } else if (contentType.includes('multipart/form-data')) {
            // This is a manual file upload from a logged-in user
            const session = await getServerSession(authOptions);
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            userEmail = session.user.email;
            
            const formData = await req.formData();
            const videoFile = formData.get('video');
            const thumbnailFile = formData.get('thumbnail');
            const title = formData.get('title');
            const description = formData.get('description');
            const privacyStatus = formData.get('privacyStatus');

            if (!videoFile || !title) {
                return NextResponse.json({ error: 'Missing required video file or title.' }, { status: 400 });
            }

            const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
            const thumbnailBuffer = thumbnailFile ? Buffer.from(await thumbnailFile.arrayBuffer()) : null;

            return await uploadToYouTube({ userEmail, title, description, privacyStatus, videoBuffer, thumbnailBuffer });
        } else {
             return NextResponse.json({ error: 'Unauthorized or invalid request format' }, { status: 401 });
        }
        // --- END OF FIX ---

    } catch (error) {
        console.error("CRITICAL Error in YouTube upload endpoint:", error.message);
        return NextResponse.json({ error: 'Failed to upload to YouTube.', details: error.message }, { status: 500 });
    }
}


// Helper function to handle the YouTube API logic
async function uploadToYouTube({ userEmail, title, description, privacyStatus, videoBuffer, thumbnailBuffer }) {
    // Get YouTube Tokens from Database
    const [rows] = await db.query('SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?', [userEmail, 'google']); // Note: platform is 'google'
    if (rows.length === 0 || !rows[0].refresh_token_encrypted) {
        return NextResponse.json({ error: 'YouTube account not connected.' }, { status: 404 });
    }
    const refreshToken = decrypt(rows[0].refresh_token_encrypted);

    // Authenticate with Google
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID, 
        process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    await oauth2Client.getAccessToken();

    const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client,
    });

    // 1. Upload the Video
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

    // 2. Set the Thumbnail (if provided)
    if (thumbnailBuffer) {
        const thumbnailStream = new Readable();
        thumbnailStream.push(thumbnailBuffer);
        thumbnailStream.push(null);
        
        await youtube.thumbnails.set({
            videoId: videoId,
            media: {
                // Assuming jpeg, you may need to make this dynamic
                mimeType: 'image/jpeg', 
                body: thumbnailStream,
            },
        });
    }

    return NextResponse.json({ message: 'Video uploaded successfully!', videoId }, { status: 200 });
}