// src/app/api/social/facebook/create-post/route.js
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
        const requestBody = await req.json();

        if (internalAuthToken === `Bearer ${process.env.INTERNAL_API_SECRET}`) {
            // This is an authorized internal call from the cron job
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
        }

        const { content, imageUrl } = requestBody; // Use the stored requestBody

        
        const [connectRows] = await db.query(
            `SELECT active_facebook_page_id FROM social_connect WHERE user_email = ? AND platform = 'facebook' LIMIT 1`,
            [userEmail]
        );
        

        if (connectRows.length === 0 || !connectRows[0].active_facebook_page_id) {
            return NextResponse.json({ error: 'No active Facebook Page is set. Please select one in settings.' }, { status: 400 });
        }
        const activePageId = connectRows[0].active_facebook_page_id;

        const [pageRows] = await db.query(
            `SELECT page_access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'facebook-page' AND page_id = ?`,
            [userEmail, activePageId]
        );
        
        if (pageRows.length === 0 || !pageRows[0].page_access_token_encrypted) {
             return NextResponse.json({ error: 'Could not find credentials for the active Facebook Page.' }, { status: 404 });
        }
        const pageAccessToken = decrypt(pageRows[0].page_access_token_encrypted);

        let response;
        if (imageUrl) {
            const absoluteImageUrl = new URL(imageUrl, process.env.NEXT_PUBLIC_APP_URL).href;
            response = await axios.post(`https://graph.facebook.com/v19.0/${activePageId}/photos`, { url: absoluteImageUrl, caption: content, access_token: pageAccessToken });
        } else {
            response = await axios.post(`https://graph.facebook.com/v19.0/${activePageId}/feed`, { message: content, access_token: pageAccessToken });
        }

        return NextResponse.json({ success: true, postId: response.data.id });

    } catch (error) {
        if (error instanceof TypeError && error.message.includes('Body has already been read')) {
             console.error("Error posting to Facebook: The request body was read more than once.");
             return NextResponse.json({ error: 'Internal server error processing the request.' }, { status: 500 });
        }
        console.error("Error posting to Facebook:", error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to post to Facebook.', details: error.response?.data?.error?.message }, { status: 500 });
    }
}