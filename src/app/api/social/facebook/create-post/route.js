// src/app/api/social/facebook/create-post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { content, imageUrl } = await req.json();

        // Step 1: Get the active page ID from the main Facebook connection row.
        const [connectRows] = await db.query(
            `SELECT active_facebook_page_id FROM social_connect WHERE user_email = ? AND platform = 'facebook' LIMIT 1`,
            [session.user.email]
        );

        if (connectRows.length === 0 || !connectRows[0].active_facebook_page_id) {
            return NextResponse.json({ error: 'No active Facebook Page has been set. Please select one in your settings.' }, { status: 400 });
        }
        const activePageId = connectRows[0].active_facebook_page_id;

        // Step 2: Get the specific page access token for that active page.
        const [pageRows] = await db.query(
            `SELECT page_access_token_encrypted FROM social_connect WHERE user_email = ? AND page_id = ?`,
            [session.user.email, activePageId]
        );
        
        if (pageRows.length === 0 || !pageRows[0].page_access_token_encrypted) {
             return NextResponse.json({ error: 'Could not find credentials for the active Facebook Page.' }, { status: 404 });
        }
        const pageAccessToken = decrypt(pageRows[0].page_access_token_encrypted);

        // Step 3: Post to the correct Facebook API endpoint based on whether an image is present.
        let response;
        if (imageUrl) {
            // Use the /photos endpoint for image posts
            const absoluteImageUrl = new URL(imageUrl, process.env.NEXTAUTH_URL).href;
            response = await axios.post(`https://graph.facebook.com/v19.0/${activePageId}/photos`, {
                url: absoluteImageUrl,
                caption: content,
                access_token: pageAccessToken,
            });
        } else {
            // Use the /feed endpoint for text-only posts
            response = await axios.post(`https://graph.facebook.com/v19.0/${activePageId}/feed`, {
                message: content,
                access_token: pageAccessToken,
            });
        }

        const postId = response.data.id || response.data.post_id;
        return NextResponse.json({ success: true, postId }, { status: 200 });

    } catch (error) {
        console.error("CRITICAL Error posting to Facebook:", error.response?.data?.error || error.message);
        const errorDetails = error.response?.data?.error?.message || 'An unknown server error occurred.';
        return NextResponse.json({ error: 'Failed to post to Facebook.', details: errorDetails }, { status: 500 });
    }
}