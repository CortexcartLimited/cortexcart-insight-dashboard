// src/app/api/social/x/create-post/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// Helper function to get the user's Twitter tokens (this is correct)
async function getTwitterConnection(connection, userEmail) {
    const [rows] = await connection.query(
        `SELECT * FROM social_connect WHERE user_email = ? AND platform = 'x'`,
        [userEmail]
    );
    if (!rows.length) {
        throw new Error(`No 'x' connection found for user: ${userEmail}`);
    }
    return rows[0];
}

// Helper function to refresh the token (this is correct)
async function refreshTwitterToken(connection, connectionRow) {
    console.log(`[X POST] Token is expired. Refreshing for ${connectionRow.user_email}`);
    try {
        const refreshToken = decrypt(connectionRow.refresh_token_encrypted);
        const response = await axios.post(
            "https://api.twitter.com/2/oauth2/token",
            new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: process.env.X_CLIENT_ID, 
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64")}`,
                },
            }
        );
        const newTokens = response.data;
        if (!newTokens.access_token) throw new Error("Failed to get new access token.");

        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
        await connection.query(
            `UPDATE social_connect SET
                access_token_encrypted = ?, refresh_token_encrypted = ?, expires_at = ?
             WHERE id = ?`,
            [
                encrypt(newTokens.access_token),
                encrypt(newTokens.refresh_token),
                newExpiresAt,
                connectionRow.id
            ]
        );
        console.log(`[X POST] Token refreshed and saved for ${connectionRow.user_email}`);
        return newTokens.access_token;
    } catch (error) {
        console.error("CRITICAL: Failed to refresh Twitter token:", error.response?.data || error.message);
        throw new Error(`Failed to refresh Twitter token: ${error.response?.data?.error_description || error.message}`);
    }
}

export async function POST(req) {
    console.log("--- X/Twitter Post API Endpoint Triggered (OAuth 2.0) ---");

    const authToken = req.headers.get('authorization');
    if (authToken !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let connection;
    try {
        // --- START OF FIX ---
        // Manually read the body as text and parse as JSON
        // This is more robust than req.json()
       let payload;
        let bodyText = ''; // Define bodyText in the outer scope
        try {
            bodyText = await req.text(); // Read the body once
            if (!bodyText) {
            throw new Error("Request body is empty.");
            }
            payload = JSON.parse(bodyText); // Try to parse
        } catch (e) {
            console.error("[X POST] Failed to parse incoming body as JSON:", e.message);
            // Safely log the body text we captured, or a fallback message
            console.error("[X POST] Received body text that failed to parse:", bodyText || "Could not read body");
            return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 });
        }

        const { content, user_email } = payload;

        if (!user_email) {
            return NextResponse.json({ error: 'user_email is required.' }, { status: 400 });
        }
        console.log(`[X POST] Processing post for user: ${user_email}`);

        connection = await db.getConnection();
        const connectionRow = await getTwitterConnection(connection, user_email);

        let accessToken = decrypt(connectionRow.access_token_encrypted);
        const tokenExpires = new Date(connectionRow.expires_at).getTime();
        if (Date.now() >= tokenExpires - 300000) { // 5-min buffer
            accessToken = await refreshTwitterToken(connection, connectionRow);
        }

        const client = new TwitterApi(accessToken);
        console.log(`[X POST] Sending tweet: "${content}"`);
        const { data: tweet } = await client.v2.tweet(content);
        console.log(`[X POST] Tweet sent successfully: ${tweet.id}`);

        return NextResponse.json({ success: true, tweetId: tweet.id });

    } catch (error) {
        console.error("CRITICAL Error posting to X/Twitter (outer catch):", error.message); 
        return NextResponse.json({ error: error.message || "Failed to post to X/Twitter." }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}