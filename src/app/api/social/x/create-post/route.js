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

        // --- START OF FIX ---
        // Corrected the query to use the columns that are already in use.
        const [userRows] = await db.query(
            "SELECT access_token_encrypted, refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'x'",
            [userEmail]
        );

        if (userRows.length === 0 || !userRows[0].access_token_encrypted || !userRows[0].refresh_token_encrypted) {
            return NextResponse.json({ error: 'X/Twitter credentials not found.' }, { status: 404 });
        }

        // Use the correct columns to decrypt the tokens.
        const accessToken = decrypt(userRows[0].access_token_encrypted);
        const accessSecret = decrypt(userRows[0].refresh_token_encrypted);
        // --- END OF FIX ---

        const client = new TwitterApi({
            appKey: process.env.X_API_KEY,
            appSecret: process.env.X_API_SECRET_KEY,
            accessToken: accessToken,
            accessSecret: accessSecret,
        });

        const { data: createdTweet } = await client.v2.tweet(content);

        return NextResponse.json({ success: true, tweetId: createdTweet.id });

    } catch (error) {
        console.error("CRITICAL Error posting to X/Twitter:", error);
        return NextResponse.json({ error: 'Failed to post to X/Twitter.', details: error.message }, { status: 500 });
    }
}