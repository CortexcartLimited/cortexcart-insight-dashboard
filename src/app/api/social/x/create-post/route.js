// src/app/api/social/x/create-post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(req) {
    try {
        const internalAuthToken = req.headers.get('authorization');
        let userEmail;
        let requestBody = await req.json(); // Read the body once

        // --- START OF FIX: DUAL AUTHENTICATION ---
        if (internalAuthToken === `Bearer ${process.env.INTERNAL_API_SECRET}`) {
            // This is an authorized internal call from the cron job.
            // Get the email from the request body.
            if (!requestBody.user_email) {
                return NextResponse.json({ error: 'user_email is required for cron job posts' }, { status: 400 });
            }
            userEmail = requestBody.user_email;
        } else {
            // This is a regular session-based call from a logged-in user.
            const session = await getServerSession(authOptions);
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            userEmail = session.user.email;
        }
        // --- END OF FIX ---

        const { content, imageUrl } = requestBody;

        if (!userEmail || !content) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [socialConnect] = await db.query(
            'SELECT * FROM social_connect WHERE user_email = ? AND platform IN (?, ?)',
            [userEmail, 'twitter', 'x']
        );


        if (socialConnect.length === 0) {
            return NextResponse.json({ message: 'Twitter account not connected' }, { status: 400 });
        }

        const accessToken = decrypt(socialConnect[0].access_token_encrypted);
        
        const twitterClient = new TwitterApi(accessToken);
        const readWriteClient = twitterClient.readWrite;

        let mediaId;
        if (imageUrl) {
            // Ensure the URL is absolute for the fetch call
            const absoluteImageUrl = new URL(imageUrl, process.env.NEXT_PUBLIC_APP_URL).href;
            const response = await fetch(absoluteImageUrl);
            const imageBuffer = await response.arrayBuffer();
            // Assuming JPEG for now, you might need to make this dynamic later
            mediaId = await twitterClient.v1.uploadMedia(Buffer.from(imageBuffer), { mimeType: 'image/jpeg' });
        }

        const postData = { text: content };
        if (mediaId) {
            postData.media = { media_ids: [mediaId] };
        }

        await readWriteClient.v2.tweet(postData);

        return NextResponse.json({ message: 'Post created successfully on X' }, { status: 201 });

    } catch (error) {
        console.error("CRITICAL Error posting to X/Twitter:", error);
        return NextResponse.json({ error: 'Failed to post to X/Twitter.', details: error.message }, { status: 500 });
    }
}