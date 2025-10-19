// src/app/api/social/x/create-post/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto'; // Import encrypt
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios'; // Use axios for the refresh request

// Helper function to get the user's Twitter tokens from social_connect
async function getTwitterConnection(connection, userEmail) {
    const [rows] = await connection.query(
        `SELECT * FROM social_connect WHERE user_email = ? AND platform = 'twitter'`,
        [userEmail]
    );
    if (!rows.length) {
        throw new Error(`No 'twitter' connection found for user: ${userEmail}`);
    }
    return rows[0];
}

// Helper function to refresh the token
async function refreshTwitterToken(connection, connectionRow) {
    console.log(`[X POST] Token is expired. Refreshing for ${connectionRow.user_email}`);
    try {
        const refreshToken = decrypt(connectionRow.refresh_token_encrypted);

        const response = await axios.post(
            "https://api.twitter.com/2/oauth2/token",
            new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: process.env.X_CLIENT_ID, // Use clientId for refresh
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64")}`,
                },
            }
        );

        const newTokens = response.data;
        if (!newTokens.access_token) {
            throw new Error("Failed to get new access token from refresh response.");
        }

        // Save the new tokens back to the database
        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
        await connection.query(
            `UPDATE social_connect SET
                access_token_encrypted = ?,
                refresh_token_encrypted = ?,
                expires_at = ?
             WHERE id = ?`,
            [
                encrypt(newTokens.access_token),
                encrypt(newTokens.refresh_token),
                newExpiresAt,
                connectionRow.id
            ]
        );
        console.log(`[X POST] Token refreshed and saved successfully for ${connectionRow.user_email}`);
        return newTokens.access_token; // Return the new, valid access token

    } catch (error) {
        console.error("CRITICAL: Failed to refresh Twitter token:", error.response?.data || error.message);
        throw new Error(`Failed to refresh Twitter token: ${error.response?.data?.error_description || error.message}`);
    }
}

export async function POST(req) {
    console.log("--- X/Twitter Post API Endpoint Triggered (OAuth 2.0) ---");

    // 1. Check for internal API secret
    const authToken = req.headers.get('authorization');
    if (authToken !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let connection;
    try {
        // 2. Get the post content and user email
        const { content, user_email } = await req.json();
        if (!user_email) {
            return NextResponse.json({ error: 'user_email is required.' }, { status: 400 });
        }
        console.log(`[X POST] Processing post for user: ${user_email}`);

        // 3. Get the user's Twitter account from the 'social_connect' table
        connection = await db.getConnection();
        const connectionRow = await getTwitterConnection(connection, user_email);

        let accessToken = decrypt(connectionRow.access_token_encrypted);

        // 4. Check if the token is expired (with a 5-minute buffer)
        const tokenExpires = new Date(connectionRow.expires_at).getTime();
        if (Date.now() >= tokenExpires - 300000) {
            accessToken = await refreshTwitterToken(connection, connectionRow);
        }

        // 5. Initialize the Twitter Client with the OAuth 2.0 Bearer Token
        const client = new TwitterApi(accessToken);

        // 6. Send the tweet
        console.log(`[X POST] Sending tweet: "${content}"`);
        const { data: tweet } = await client.v2.tweet(content);
        console.log(`[X POST] Tweet sent successfully: ${tweet.id}`);

        return NextResponse.json({ success: true, tweetId: tweet.id });

    } catch (error) {
        console.error("CRITICAL Error posting to X/Twitter (outer catch):", error.response?.data || error.message);
        
        let errorMessage = "Failed to post to X/Twitter.";
        // NOTE: The "AccessSecret" log from your old file is GONE in this new code.
        if (error.response?.data?.status === 401) {
            errorMessage = "401 Unauthorized. The user's token may be revoked. Please re-connect.";
        } else if (error.response?.data?.status === 403) {
             errorMessage = "403 Forbidden. Check your app's permissions in the X Developer Portal.";
        }
        
        return NextResponse.json({ error: errorMessage, details: error.response?.data || error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}