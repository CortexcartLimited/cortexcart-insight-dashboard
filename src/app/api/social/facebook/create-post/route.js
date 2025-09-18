// src/app/api/social/facebook/create-post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Correctly query for the user's active page credentials
        const [pageRows] = await db.query(
            `SELECT page_id, page_access_token_encrypted 
             FROM social_connect 
             WHERE user_email = ? AND platform = 'facebook' AND active_facebook_page_id IS NOT NULL`,
            [session.user.email]
        );

        if (pageRows.length === 0) {
            return NextResponse.json({ 
                error: 'Failed to post to Facebook.', 
                details: 'No active Facebook Page connected.' 
            }, { status: 404 });
        }
        
        const pageAccessToken = decrypt(pageRows[0].page_access_token_encrypted);
        const pageId = pageRows[0].page_id;
        
        let response;
        const contentType = req.headers.get('content-type') || '';

        // Handle file uploads
        if (contentType.includes('multipart/form-data')) {
            const incomingFormData = await req.formData();
            const content = incomingFormData.get('content');
            const imageFile = incomingFormData.get('image');
            
            if (!imageFile) {
                return NextResponse.json({ error: 'Image file is missing.' }, { status: 400 });
            }

            const form = new FormData();
            form.append('caption', content);
            form.append('access_token', pageAccessToken);
            
            const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
            form.append('source', imageBuffer, {
                filename: imageFile.name,
                contentType: imageFile.type,
            });

            response = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, form, {
                headers: form.getHeaders(),
            });

        } else {
            // Handle text-only posts
            const body = await req.json();
            const { content } = body;
            response = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
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