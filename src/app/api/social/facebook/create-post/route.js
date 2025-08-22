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

    const { content, imageUrl } = await req.json();
    const userEmail = session.user.email;

    try {
        // --- THE FIX: Corrected the column name in the database query ---
        const [pageRows] = await db.query(
            'SELECT page_id, page_name, access_token_encrypted FROM facebook_pages WHERE user_email = ? AND is_active = 1',
            [userEmail]
        );

        if (pageRows.length === 0) {
            return NextResponse.json({ error: 'No active Facebook Page connected. Please select one in your settings.' }, { status: 404 });
        }
        
        const activePage = pageRows[0];
        // Use the corrected column name when decrypting the token
        const pageAccessToken = decrypt(activePage.access_token_encrypted);
        const pageId = activePage.page_id;

        const endpoint = imageUrl 
            ? `https://graph.facebook.com/${pageId}/photos` 
            : `https://graph.facebook.com/${pageId}/feed`;

        const requestBody = {
            access_token: pageAccessToken,
            message: content,
            caption: content,
        };

        if (imageUrl) {
            requestBody.url = imageUrl;
        }

        const response = await axios.post(endpoint, requestBody);

        if (response.status !== 200) {
            throw new Error(`Facebook API responded with status ${response.status}`);
        }

        return NextResponse.json({ success: true, postId: response.data.id });

    } catch (error) {
        console.error("Error in create-post function:", error.response ? error.response.data : error.message);
        
        const fbError = error.response?.data?.error;
        if (fbError) {
            if (fbError.code === 190) {
                 return NextResponse.json({
                    error: "Your Facebook connection has expired. Please go to your settings and reconnect your account."
                }, { status: 401 });
            }
            return NextResponse.json({ error: `Facebook Error: ${fbError.message}` }, { status: 500 });
        }
        
        // This will now catch the database error and report it clearly
        return NextResponse.json({ error: `An unexpected server error occurred: ${error.message}` }, { status: 500 });
    }
}