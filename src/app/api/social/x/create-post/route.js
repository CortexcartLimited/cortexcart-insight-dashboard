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

        const [userRows] = await db.query(
            "SELECT access_token_encrypted, refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'x'",
            [userEmail]
        );

        if (userRows.length === 0 || !userRows[0].access_token_encrypted || !userRows[0].refresh_token_encrypted) {
            console.error(`No X/Twitter credentials found in database for ${userEmail}.`);
            return NextResponse.json({ error: 'X/Twitter credentials not found for this user.' }, { status: 404 });
        }

        // --- START OF TOKEN DEBUGGING ---
        let accessToken, accessSecret;
        try {
            console.log("Attempting to decrypt tokens...");
            accessToken = decrypt(userRows[0].access_token_encrypted);
            accessSecret = decrypt(userRows[0].refresh_token_encrypted);

            // Log partial decrypted tokens FOR DEBUGGING ONLY
            console.log(`Decrypted Access Token (first 5): ${accessToken ? accessToken.substring(0, 5) : 'null or empty'}...`);
            console.log(`Decrypted Access Secret (first 5): ${accessSecret ? accessSecret.substring(0, 5) : 'null or empty'}...`);

        } catch (decryptionError) {
            console.error("CRITICAL Error decrypting user tokens:", decryptionError.message);
            throw new Error("Failed to decrypt user credentials.");
        }
        // --- END OF TOKEN DEBUGGING ---


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

        console.log("Sending tweet...");
        const { data: createdTweet } = await client.v2.tweet(content);
        console.log(`Successfully posted tweet ID: ${createdTweet.id}`);

        return NextResponse.json({ success: true, tweetId: createdTweet.id });

    } catch (error) {
        console.error("CRITICAL Error posting to X/Twitter:", error.message);
         // Add detailed logging for 401 errors specifically
        if (error.code === 401 || (error.response && error.response.status === 401)) {
            console.error("Received 401 Unauthorized from Twitter API. User tokens may be invalid or expired.");
            // Log partial tokens again right before the error
            console.error(`Tokens used (partial): AccessToken=${accessToken ? accessToken.substring(0, 5) : 'N/A'}..., AccessSecret=${accessSecret ? accessSecret.substring(0, 5) : 'N/A'}...`);
        } else if (error.response?.data) {
             console.error("X/Twitter API Response Error:", error.response.data);
        }
        return NextResponse.json({ error: 'Failed to post to X/Twitter.', details: error.message }, { status: 500 });
    }
}