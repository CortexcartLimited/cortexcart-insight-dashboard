// src/app/api/social/instagram/accounts/post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { instagramUserId, imageUrl, caption } = await req.json();
        if (!instagramUserId || !imageUrl) {
            return NextResponse.json({ error: 'Image and Instagram account are required.' }, { status: 400 });
        }

        const [accountRows] = await db.query(
            `SELECT page_id FROM instagram_accounts WHERE instagram_id = ? AND user_email = ?`,
            [instagramUserId, session.user.email]
        );

        if (accountRows.length === 0) {
            return NextResponse.json({ error: 'Could not find the linked Facebook page for this Instagram account.' }, { status: 404 });
        }
        const linkedPageId = accountRows[0].page_id;

        const [pageRows] = await db.query(
            `SELECT page_access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'facebook-page' AND page_id = ?`,
            [session.user.email, linkedPageId]
        );

        if (pageRows.length === 0 || !pageRows[0].page_access_token_encrypted) {
             return NextResponse.json({ error: 'Could not find credentials for the linked Facebook Page.' }, { status: 404 });
        }
        const accessToken = decrypt(pageRows[0].page_access_token_encrypted);

        // --- ENHANCED ERROR HANDLING ---
        // Step 1: Create Media Container
        const absoluteImageUrl = new URL(imageUrl, process.env.NEXTAUTH_URL).href;
        const createContainerResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${instagramUserId}/media`,
            { image_url: absoluteImageUrl, caption: caption, access_token: accessToken }
        );

        // Check if the container was created successfully BEFORE proceeding
        const creationId = createContainerResponse.data?.id;
        if (!creationId) {
            // If there's no ID, throw a specific error with the response from Facebook
            throw new Error(`Failed to create media container. API response: ${JSON.stringify(createContainerResponse.data)}`);
        }

        // Step 2: Publish the container
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