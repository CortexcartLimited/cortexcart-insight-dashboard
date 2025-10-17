// src/app/api/social/x/create-post/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { TwitterApi } from 'twitter-api-v2';
import { decrypt } from '@/lib/crypto';

export async function POST(req) {
    console.log("--- X/Twitter Post API Endpoint Triggered ---");
    const appKeyFromEnv = process.env.X_CLIENT_ID;
    const appSecretFromEnv = process.env.X_CLIENT_SECRET;

    console.log(`Is X_CLIENT_ID present? ${!!appKeyFromEnv}`);
    console.log(`Is X_CLIENT_SECRET present? ${!!appSecretFromEnv}`);

    let userEmail;
    const requestBody = await req.json();
    let accessToken, accessSecret; // Define outside try block for wider scope in error logging

    try {
        if (!appKeyFromEnv || !appSecretFromEnv) {
            console.error("CRITICAL ERROR: X_CLIENT_ID or X_CLIENT_SECRET environment variables are missing or empty.");
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
         console.log(`Tweet content: "${content}"`); // Log the content

        const [userRows] = await db.query(
            "SELECT access_token_encrypted, refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'x'",
            [userEmail]
        );

        if (userRows.length === 0 || !userRows[0].access_token_encrypted || !userRows[0].refresh_token_encrypted) {
            console.error(`No X/Twitter credentials found in database for ${userEmail}.`);
            return NextResponse.json({ error: 'X/Twitter credentials not found for this user.' }, { status: 404 });
        }

        try {
            console.log("Attempting to decrypt tokens...");
            accessToken = decrypt(userRows[0].access_token_encrypted);
            accessSecret = decrypt(userRows[0].refresh_token_encrypted);
            console.log(`Decrypted Access Token (first 5): ${accessToken ? accessToken.substring(0, 5) : 'null or empty'}...`);
            console.log(`Decrypted Access Secret (first 5): ${accessSecret ? accessSecret.substring(0, 5) : 'null or empty'}...`);
        } catch (decryptionError) {
            console.error("CRITICAL Error decrypting user tokens:", decryptionError.message);
            throw new Error("Failed to decrypt user credentials.");
        }

        if (!accessToken || !accessSecret) {
             console.error("Decrypted tokens are missing or empty.");
             throw new Error("Invalid user credentials after decryption.");
        }

        console.log("Initializing TwitterApi client...");
        const client = new TwitterApi({
            appKey: appKeyFromEnv,
            appSecret: appSecretFromEnv,
            accessToken: accessToken,
            accessSecret: accessSecret,
        });

        // --- START OF DETAILED TWEET ERROR HANDLING ---
        let createdTweet;
        try {
            console.log("Sending tweet via client.v2.tweet...");
            const response = await client.v2.tweet(content);
            createdTweet = response.data; // Assuming success structure
            console.log(`Successfully posted tweet ID: ${createdTweet.id}`);
        } catch (tweetError) {
            console.error("Error occurred during client.v2.tweet call:");
            // Log everything about the error from twitter-api-v2
            console.error("tweetError object:", JSON.stringify(tweetError, null, 2));
            // Specifically log rate limit info if available
            if (tweetError.rateLimit) {
                 console.error("Rate limit info:", tweetError.rateLimit);
            }
             // Specifically log response body if available (might not be JSON)
            if (tweetError.response?.data) {
                 console.error("Twitter API raw response data:", tweetError.response.data);
            }
            // Re-throw the error to be caught by the outer catch block
            throw tweetError;
        }
        // --- END OF DETAILED TWEET ERROR HANDLING ---

        return NextResponse.json({ success: true, tweetId: createdTweet.id });

    } catch (error) {
        // This outer catch block now handles errors from setup OR re-thrown errors from tweet attempt
        console.error("CRITICAL Error posting to X/Twitter (outer catch):", error.message);
        // Log partial tokens if available and the error happened after decryption
        if (accessToken || accessSecret) {
             console.error(`Tokens used (partial): AccessToken=${accessToken ? accessToken.substring(0, 5) : 'N/A'}..., AccessSecret=${accessSecret ? accessSecret.substring(0, 5) : 'N/A'}...`);
        }
        // Log specific API response data if available from the error object
        if (error.response?.data) {
             console.error("X/Twitter API Response Error (outer catch):", error.response.data);
        }
        return NextResponse.json({ error: 'Failed to post to X/Twitter.', details: error.message }, { status: 500 });
    }
}