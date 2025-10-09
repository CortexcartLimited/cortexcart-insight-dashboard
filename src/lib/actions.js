// src/lib/actions.js

'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

export async function completePinterestConnection(code, state) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        throw new Error('User not authenticated');
    }

    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('pinterest_oauth_code_verifier')?.value;
    const originalState = cookieStore.get('pinterest_oauth_state')?.value;

    if (!code || !state || !codeVerifier || !originalState || state !== originalState) {
        throw new Error('Invalid callback parameters. Please try connecting again.');
    }

    try {
        const redirectUri = new URL('/connect/callback/pinterest', process.env.NEXTAUTH_URL).toString();
        
        const tokenResponse = await axios.post('https://api.pinterest.com/v5/oauth/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }).toString(), {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        const expires_at = new Date(Date.now() + expires_in * 1000);

        // Save the connection tokens
        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, expires_at)
             VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE 
                 access_token_encrypted = VALUES(access_token_encrypted), 
                 refresh_token_encrypted = VALUES(refresh_token_encrypted),
                 expires_at = VALUES(expires_at);`,
            [session.user.email, 'pinterest', encrypt(access_token), encrypt(refresh_token), expires_at]
        );
        
        // --- FETCH AND SAVE BOARDS ---
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

        cookieStore.delete('pinterest_oauth_state');
        cookieStore.delete('pinterest_oauth_code_verifier');

    } catch (error) {
        console.error("CRITICAL Pinterest Connection Error:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error('An error occurred while connecting your Pinterest account.');
    }

    redirect('/settings?success=pinterest_connected');
}