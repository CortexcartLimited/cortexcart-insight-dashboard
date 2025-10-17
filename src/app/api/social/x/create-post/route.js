// src/app/api/social/x/create-post/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { TwitterApi } from 'twitter-api-v2';
import { decrypt } from '@/lib/crypto';

export async function POST(req) {
    // --- Start of Debugging / Correction ---
    console.log("--- X/Twitter Post API Endpoint Triggered ---");
    // Corrected to match .env.production and ecosystem.config.js
    const appKeyFromEnv = process.env.x_client_id;
    const appSecretFromEnv = process.env.x_client_secret;

    console.log(`Is x_client_id present? ${!!appKeyFromEnv}`);
    console.log(`Is x_client_secret present? ${!!appSecretFromEnv}`);

    if (appKeyFromEnv) {
        console.log(`x_client_id (first 5 chars): ${appKeyFromEnv.substring(0, 5)}...`);
    } else {
        console.log("x_client_id is MISSING from environment variables!");
    }
     if (appSecretFromEnv) {
        console.log(`x_client_secret (first 5 chars): ${appSecretFromEnv.substring(0, 5)}...`);
    } else {
        console.log("x_client_secret is MISSING from environment variables!");
    }
    // --- End of Debugging / Correction ---

    let userEmail;
    const requestBody = await req.json();

    try {
        // Corrected the check to use the new variable names
        if (!appKeyFromEnv || !appSecretFromEnv) {
            console.error("CRITICAL ERROR: x_client_id or x_client_secret environment variables are missing or empty.");
            throw new Error("Application is not configured correctly for X/Twitter API. Consumer keys (client ID/secret) are missing.");
        }

        const internalAuthToken = req.headers.get('authorization');

        if (internalAuthToken === `Bearer ${process.env.INTERNAL_API_SECRET}`) {
            console.log("Request is from internal cron job.");
            if (!requestBody.user_email) {
                return NextResponse.json({ error: 'user_email is required for cron job posts' }, { status: 400 });
            }
            userEmail = requestBody.user_email;
        } else {
            console.log("Request is from a logged-in user session.");
            const session = await getServerSession(authOptions);
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            userEmail = session.user.email;
        }
        console.log(`Processing post for user: ${userEmail}`);

        const { content } = requestBody;
        if (!content) {
            return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
        }

        const [userRows] = await db.query(
            "SELECT access_token_encrypted, refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'x'",
            [userEmail]
        );

        if (userRows.length === 0 || !userRows[0].access_token_encrypted || !userRows[0].refresh_token_encrypted) {
            console.error(`No X/Twitter credentials found in database for ${userEmail}.`);
            return NextResponse.json({ error: 'X/Twitter credentials not found for this user.' }, { status: 404 });
        }

        const accessToken = decrypt(userRows[0].access_token_encrypted);
        const accessSecret = decrypt(userRows[0].refresh_token_encrypted);

        // Corrected the TwitterApi instantiation to use the new variable names
        const client = new TwitterApi({
            appKey: appKeyFromEnv,
            appSecret: appSecretFromEnv,
            accessToken: accessToken,
            accessSecret: accessSecret,
        });

        const { data: createdTweet } = await client.v2.tweet(content);
        console.log(`Successfully posted tweet ID: ${createdTweet.id}`);

        return NextResponse.json({ success: true, tweetId: createdTweet.id });

    } catch (error) {
        console.error("CRITICAL Error posting to X/Twitter:", error.message);
        // Add more detailed error logging if available
        if (error.response?.data) {
             console.error("X/Twitter API Response Error:", error.response.data);
        }
        return NextResponse.json({ error: 'Failed to post to X/Twitter.', details: error.message }, { status: 500 });
    }
}