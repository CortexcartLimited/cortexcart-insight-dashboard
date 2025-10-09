// src/app/api/social/pinterest/post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId, imageUrl, title, description } = await req.json();
    const userEmail = session.user.email;

    if (!boardId || !imageUrl || !title) {
        return NextResponse.json({ error: 'A board, image, and title are required.' }, { status: 400 });
    }

    try {
        const [rows] = await db.query(
            'SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [userEmail, 'pinterest']
        );

        if (rows.length === 0 || !rows[0].refresh_token_encrypted) {
            return NextResponse.json({ error: 'Pinterest account not connected or refresh token is missing.' }, { status: 404 });
        }

        const refreshToken = decrypt(rows[0].refresh_token_encrypted);

        // --- Step 1: Refresh the Access Token ---
        const tokenResponse = await axios.post('https://api-sandbox.pinterest.com/v5/oauth/token', new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }), {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const newAccessToken = tokenResponse.data.access_token;

        // --- Step 2: Convert to Absolute Image URL ---
        const absoluteImageUrl = new URL(imageUrl, process.env.NEXTAUTH_URL).href;

        // --- Step 3: Create the Pin ---
        await axios.post('https://api.pinterest.com/v5/pins', {
            board_id: boardId,
            media_source: {
                source_type: 'image_url',
                url: absoluteImageUrl
            },
            title: title,
            note: description,
        }, {
            headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return NextResponse.json({ success: true, message: 'Pin created successfully!' });

    } catch (error) {
        console.error("Error posting to Pinterest:", error.response ? error.response.data : error.message);
        const apiError = error.response?.data?.message || error.message;

        // Check for expired token error
        if (apiError.includes('authorization failed')) {
            return NextResponse.json({
                error: "Your Pinterest connection has expired. Please go to your settings and reconnect your account."
            }, { status: 401 });
        }

        return NextResponse.json({ error: `Pinterest Error: ${apiError}` }, { status: 500 });
    }
}