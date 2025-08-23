// src/app/api/social/facebook/create-post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, imageUrl } = await req.json(); // imageUrl is relative (e.g., /uploads/image.jpg)
    const userEmail = session.user.email;

    try {
        const [pageRows] = await db.query(
            'SELECT page_id, page_name, page_access_token_encrypted FROM facebook_pages WHERE user_email = ? ORDER BY id DESC LIMIT 1',
            [userEmail]
        );

        if (pageRows.length === 0) {
            return NextResponse.json({ error: 'No Facebook Page connected.' }, { status: 404 });
        }
        
        const activePage = pageRows[0];
        const pageAccessToken = decrypt(activePage.page_access_token_encrypted);
        const pageId = activePage.page_id;

        const endpoint = imageUrl 
            ? `https://graph.facebook.com/${pageId}/photos` 
            : `https://graph.facebook.com/${pageId}/feed`;

        const requestBody = {
            access_token: pageAccessToken,
            message: content,
            caption: content,
        };

        // --- THE FIX: Convert the relative imageUrl to an absolute URL ---
        if (imageUrl) {
            // This combines your site's base URL with the relative image path
            const absoluteImageUrl = new URL(imageUrl, process.env.NEXTAUTH_URL).href;
            requestBody.url = absoluteImageUrl;
        }

        const response = await axios.post(endpoint, requestBody);

        if (response.status !== 200) {
            throw new Error(`Facebook API responded with status ${response.status}`);
        }

        return NextResponse.json({ success: true, postId: response.data.id });

    } catch (error) {
        console.error("Error in create-post function:", error.response ? error.response.data.error : error.message);
        
        const fbError = error.response?.data?.error;
        if (fbError) {
            if (fbError.code === 190) {
                 return NextResponse.json({
                    error: "Your Facebook connection has expired. Please go to your settings and reconnect your account."
                }, { status: 401 });
            }
            return NextResponse.json({ error: `Facebook Error: ${fbError.message}` }, { status: 500 });
        }
        
        return NextResponse.json({ error: `An unexpected server error occurred: ${error.message}` }, { status: 500 });
    }
}