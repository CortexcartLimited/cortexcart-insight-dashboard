import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const content = formData.get('content');
        const imageFile = formData.get('image'); // Assuming the key is 'image'

        const [userRows] = await db.query(
            `SELECT sc.page_id, sc.page_access_token_encrypted 
             FROM social_connect sc
             JOIN users u ON sc.user_email = u.email
             WHERE u.email = ? AND sc.platform = 'facebook' AND sc.page_id IS NOT NULL`,
            [session.user.email]
        );

        if (userRows.length === 0 || !userRows[0].page_id || !userRows[0].page_access_token_encrypted) {
            return NextResponse.json({ error: 'Facebook Page not connected or configured.' }, { status: 400 });
        }

        const pageId = userRows[0].page_id;
        const pageAccessToken = decrypt(userRows[0].page_access_token_encrypted);
        
        let response;
        if (imageFile) {
            // Logic for photo post
            const imageUrl = `${process.env.NEXTAUTH_URL}/uploads/${imageFile.name}`;
            response = await axios.post(`https://graph.facebook.com/${pageId}/photos`, {
                url: imageUrl,
                caption: content,
                access_token: pageAccessToken,
            });
        } else {
            // Logic for text-only post
            response = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                message: content,
                access_token: pageAccessToken,
            });
        }

        // Add post to our database
        await db.query(
            'INSERT INTO posts (user_email, platform, post_id, content, created_at, status) VALUES (?, ?, ?, ?, NOW(), ?)',
            [session.user.email, 'facebook', response.data.id, content, 'posted']
        );

        return NextResponse.json({ success: true, postId: response.data.id }, { status: 200 });

    } catch (error) {
        // --- IMPROVED LOGGING ---
        console.error("CRITICAL Error posting to Facebook:");
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
            console.error("Error Status:", error.response.status);
            console.error("Error Headers:", error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Error Request:", error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error Message:', error.message);
        }
        
        const errorDetails = error.response ? error.response.data.error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: 'Failed to post to Facebook.', details: errorDetails }, { status: 500 });
    }
}