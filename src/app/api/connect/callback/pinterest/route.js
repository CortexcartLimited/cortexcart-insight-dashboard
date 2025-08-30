// src/app/api/connect/callback/pinterest/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    // Use the reliable NEXTAUTH_URL for all redirects
    const baseUrl = process.env.NEXTAUTH_URL;

    if (!session?.user?.email) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Security check: ensure the 'state' matches the logged-in user
    if (!code || !state || state !== session.user.email) {
        const errorUrl = new URL('/settings', baseUrl); // Use baseUrl
        errorUrl.searchParams.set('error', 'Pinterest connection failed: Invalid state.');
        return NextResponse.redirect(errorUrl);
    }

    try {
        // 1. Exchange the code for an access token
        const tokenResponse = await axios.post('https://api.pinterest.com/v5/oauth/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${baseUrl}/api/connect/callback/pinterest`, // Use baseUrl
        }), {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // 2. Save the tokens to the database for the logged-in user
        const expires_at = new Date(Date.now() + expires_in * 1000);
        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, expires_at)
             VALUES (?, 'pinterest', ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                access_token_encrypted = VALUES(access_token_encrypted),
                refresh_token_encrypted = VALUES(refresh_token_encrypted),
                expires_at = VALUES(expires_at);`,
            [session.user.email, encrypt(access_token), encrypt(refresh_token), expires_at]
        );

        // (Optional but Recommended) Fetch and save boards
        const boardsResponse = await axios.get('https://api.pinterest.com/v5/boards', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        if (boardsResponse.data && boardsResponse.data.items) {
            for (const board of boardsResponse.data.items) {
                await db.query(
                    `INSERT INTO pinterest_boards (user_email, board_id, board_name)
                     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE board_name = VALUES(board_name);`,
                    [session.user.email, board.id, board.name]
                );
            }
        }

        // 3. Redirect back to settings with a success message
        const successUrl = new URL('/settings', baseUrl); // Use baseUrl
        successUrl.searchParams.set('success', 'pinterest-connected');
        return NextResponse.redirect(successUrl);

    } catch (error) {
        console.error("Pinterest callback error:", error.response ? error.response.data : error.message);
        const errorUrl = new URL('/settings', baseUrl); // Use baseUrl
        errorUrl.searchParams.set('error', 'Failed to get Pinterest tokens.');
        return NextResponse.redirect(errorUrl);
    }
}