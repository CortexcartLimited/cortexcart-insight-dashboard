// src/app/api/social/instagram/accounts/post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST(req) {
    try {
        const internalAuthToken = req.headers.get('authorization');
        let userEmail;
        let requestBody;

        // --- START OF FIX: DUAL AUTHENTICATION ---
        if (internalAuthToken === `Bearer ${process.env.INTERNAL_API_SECRET}`) {
            // This is an authorized internal call from the cron job
            requestBody = await req.json();
            if (!requestBody.user_email) {
                return NextResponse.json({ error: 'user_email is required for cron job posts' }, { status: 400 });
            }
            userEmail = requestBody.user_email;
        } else {
            // This is a regular session-based call from a logged-in user
            const session = await getServerSession(authOptions);
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            userEmail = session.user.email;
            requestBody = await req.json();
        }
        // --- END OF FIX ---

        const { instagramUserId, imageUrl, caption } = requestBody;
        if (!instagramUserId || !imageUrl) {
            return NextResponse.json({ error: 'Image and Instagram account are required.' }, { status: 400 });
        }

        const [accountRows] = await db.query(
            `SELECT page_id FROM instagram_accounts WHERE instagram_id = ? AND user_email = ?`,
            [instagramUserId, userEmail]
        );

        if (accountRows.length === 0) {
            return NextResponse.json({ error: 'Could not find the linked Facebook page for this Instagram account.' }, { status: 404 });
        }
        const linkedPageId = accountRows[0].page_id;

        const [pageRows] = await db.query(
            `SELECT page_access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'facebook-page' AND page_id = ?`,
            [userEmail, linkedPageId]
        );

        if (pageRows.length === 0 || !pageRows[0].page_access_token_encrypted) {
             return NextResponse.json({ error: 'Could not find credentials for the linked Facebook Page.' }, { status: 404 });
        }
        const accessToken = decrypt(pageRows[0].page_access_token_encrypted);

        // Use the consistent public URL environment variable
        const absoluteImageUrl = new URL(imageUrl, process.env.NEXT_PUBLIC_APP_URL).href;
        console.log(`Attempting to post image to Instagram with URL: ${absoluteImageUrl}`);
        
        const createContainerResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${instagramUserId}/media`,
            { image_url: absoluteImageUrl, caption: caption, access_token: accessToken }
        );

        const creationId = createContainerResponse.data?.id;
        if (!creationId) {
            throw new Error(`Failed to create media container. API response: ${JSON.stringify(createContainerResponse.data)}`);
        }

        await axios.post(
            `https://graph.facebook.com/v19.0/${instagramUserId}/media_publish`,
            { creation_id: creationId, access_token: accessToken }
        );

        return NextResponse.json({ success: true, message: 'Posted to Instagram successfully!' });
    } catch (error) {
        console.error("Error posting to Instagram:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error?.message || error.message || 'An unexpected error occurred.';
        return NextResponse.json({ error: `Instagram Error: ${errorMessage}` }, { status: 500 });
    }
}