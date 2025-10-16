// src/app/api/social/x/create-post/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { TwitterApi } from 'twitter-api-v2';
import { decrypt } from '@/lib/crypto';

export async function POST(req) {
    let userEmail;
    const requestBody = await req.json();

    try {
        const internalAuthToken = req.headers.get('authorization');

        // --- START OF FIX ---
        if (internalAuthToken === `Bearer ${process.env.INTERNAL_API_SECRET}`) {
            // Authorized internal call from the cron job
            if (!requestBody.user_email) {
                return NextResponse.json({ error: 'user_email is required for cron job posts' }, { status: 400 });
            }
            userEmail = requestBody.user_email;
        } else {
            // Regular session-based call from a logged-in user
            const session = await getServerSession(authOptions);
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            userEmail = session.user.email;
        }

        const { content } = requestBody;

        if (!content) {
            return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
        }

        const [userRows] = await db.query(
            'SELECT x_oauth_token_encrypted, x_oauth_token_secret_encrypted FROM social_connect WHERE user_email = ?',
            [userEmail]
        );

        if (userRows.length === 0 || !userRows[0].x_oauth_token_encrypted || !userRows[0].x_oauth_token_secret_encrypted) {
            return NextResponse.json({ error: 'X/Twitter credentials not found.' }, { status: 404 });
        }

        const accessToken = decrypt(userRows[0].x_oauth_token_encrypted);
        const accessSecret = decrypt(userRows[0].x_oauth_token_secret_encrypted);

        const client = new TwitterApi({
            appKey: process.env.X_API_KEY,
            appSecret: process.env.X_API_SECRET_KEY,
            accessToken: accessToken,
            accessSecret: accessSecret,
        });

        const { data: createdTweet } = await client.v2.tweet(content);
        // --- END OF FIX ---

        return NextResponse.json({ success: true, tweetId: createdTweet.id });

    } catch (error) {
        console.error("CRITICAL Error posting to X/Twitter:", error);
        return NextResponse.json({ error: 'Failed to post to X/Twitter.', details: error.message }, { status: 500 });
    }
}