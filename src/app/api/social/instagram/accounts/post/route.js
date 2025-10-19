// src/app/api/social/instagram/accounts/post/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

// Helper function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req) {
    // 1. Check for internal API secret
    const authToken = req.headers.get('authorization');
    if (authToken !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let connection;
    let containerId = null; // Define containerId here for error logging

    try {
        // 2. Get payload from the cron job
        const { user_email, caption, imageUrl, instagramUserId } = await req.json();

        // 3. Get the correct Page Access Token for this user
        connection = await db.getConnection();

        // 3a. Find the page_id linked to this instagram_id
        const [igAccountRows] = await db.query(
            `SELECT page_id FROM instagram_accounts WHERE instagram_id = ? AND user_email = ?`,
            [instagramUserId, user_email]
        );

        if (!igAccountRows.length) {
            throw new Error(`No instagram_account entry found for user ${user_email} with IG ID ${instagramUserId}`);
        }
        const pageId = igAccountRows[0].page_id;

        // 3b. Use the page_id to get the encrypted page_access_token
        const [pageRows] = await db.query(
            `SELECT page_access_token_encrypted FROM social_connect WHERE page_id = ? AND user_email = ? AND platform = 'facebook-page'`,
            [pageId, user_email]
        );

        if (!pageRows.length || !pageRows[0].page_access_token_encrypted) {
            throw new Error(`No 'facebook-page' entry found for user ${user_email} with Page ID ${pageId}`);
        }

        // 3c. Decrypt the token
        const accessToken = decrypt(pageRows[0].page_access_token_encrypted);
        
        // --- START OF FIX ---
        // The 'imageUrl' variable (e.g., "/uploads/image.jpg") already has the path.
        // We just need to add the domain.
        const fullImageUrl = `${process.env.NEXTAUTH_URL}${imageUrl}`;
        // --- END OF FIX ---


        // --- START INSTAGRAM 3-STEP POSTING LOGIC ---

        // --- STEP 1: Create Media Container ---
        console.log(`[IG POST] 1/3: Creating media container for image: ${fullImageUrl}`); // This will now show the correct URL
        const containerUrl = `https://graph.facebook.com/v19.0/${instagramUserId}/media`;
        const containerParams = new URLSearchParams({
            image_url: fullImageUrl,
            caption: caption,
            access_token: accessToken,
        });

        const containerRes = await axios.post(containerUrl, containerParams);
        containerId = containerRes.data.id;
        if (!containerId) {
            throw new Error('Failed to create media container.');
        }
        console.log(`[IG POST] 1/3: Media container created: ${containerId}`);


        // --- STEP 2: Poll for Container Status ---
        // (This part is correct, no changes needed)
        console.log(`[IG POST] 2/3: Polling container status...`);
        let status = '';
        const maxAttempts = 20; // Poll for a maximum of ~60 seconds
        const pollDelay = 3000; // Wait 3 seconds between polls

        for (let i = 0; i < maxAttempts; i++) {
            const statusUrl = `https://graph.facebook.com/v19.0/${containerId}`;
            const statusParams = new URLSearchParams({
                fields: 'status_code',
                access_token: accessToken,
            });

            const statusRes = await axios.get(`${statusUrl}?${statusParams.toString()}`);
            status = statusRes.data.status_code;

            if (status === 'FINISHED') {
                console.log(`[IG POST] 2/3: Media container is FINISHED.`);
                break; // Exit loop, ready to publish
            } else if (status === 'ERROR') {
                const errorStatusRes = await axios.get(`${statusUrl}?fields=error_message&access_token=${accessToken}`);
                throw new Error(`Media container processing failed: ${errorStatusRes.data.error_message}`);
            }

            await sleep(pollDelay);
        }

        if (status !== 'FINISHED') {
            throw new Error(`Media container was not ready after ${maxAttempts} attempts. Last status: ${status}`);
        }

        // --- STEP 3: Publish the Media ---
        // (This part is correct, no changes needed)
        console.log(`[IG POST] 3/3: Publishing media...`);
        const publishUrl = `https://graph.facebook.com/v19.0/${instagramUserId}/media_publish`;
        const publishParams = new URLSearchParams({
            creation_id: containerId,
            access_token: accessToken,
        });

        const publishRes = await axios.post(publishUrl, publishParams);
        console.log(`[IG POST] 3/3: Successfully published with media ID: ${publishRes.data.id}`);
        
        return NextResponse.json({ success: true, media_id: publishRes.data.id });

    } catch (error) {
        console.error(`[IG POST] Error posting to Instagram (Container ID: ${containerId}):`, error.response?.data || error.message);
        
        const apiError = error.response?.data?.error;
        let errorMessage = error.message;

        if (apiError) {
            errorMessage = `API Error ${apiError.code} (${apiError.error_subcode}): ${apiError.error_user_title} - ${apiError.error_user_msg}`;
        }
        
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}