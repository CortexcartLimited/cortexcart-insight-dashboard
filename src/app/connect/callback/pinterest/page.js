// src/app/connect/callback/pinterest/page.js

'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

export default async function PinterestCallbackPage({ searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return redirect('/login?error=unauthenticated');
    }

    const { code, state } = searchParams;
    const codeVerifier = (await cookies().get('pinterest_oauth_code_verifier'))?.value;
    const originalState = (await cookies().get('pinterest_oauth_state'))?.value;

    if (!code || !state || !codeVerifier || !originalState || state !== originalState) {
        return <p>Error: Invalid callback parameters. Please try connecting again.</p>;
    }

    // --- START DEBUGGING BLOCK ---
    const clientId = process.env.PINTEREST_CLIENT_ID;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    const redirectUri = new URL('/connect/callback/pinterest', process.env.NEXTAUTH_URL).toString();
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    
    console.log("--- PINTEREST TOKEN REQUEST ---");
    console.log("Client ID:", clientId ? "Set" : "MISSING!");
    console.log("Client Secret:", clientSecret ? "Set" : "MISSING!");
    console.log("Redirect URI:", redirectUri);
    console.log("Authorization Header:", authHeader);
    console.log("Code Verifier:", codeVerifier);
    console.log("----------------------------");
    // --- END DEBUGGING BLOCK ---

    try {
        const tokenResponse = await axios.post('https://api.pinterest.com/v5/oauth/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }).toString(), {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        const expires_at = new Date(Date.now() + expires_in * 1000);

        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, expires_at)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                 access_token_encrypted = VALUES(access_token_encrypted), 
                 refresh_token_encrypted = VALUES(refresh_token_encrypted),
                 expires_at = VALUES(expires_at);`,
            [session.user.email, 'pinterest', encrypt(access_token), encrypt(refresh_token), expires_at]
        );
        
        await cookies().delete('pinterest_oauth_state');
        await cookies().delete('pinterest_oauth_code_verifier');

        return redirect('/settings?success=pinterest_connected');
    } catch (error) {
        console.error("CRITICAL Pinterest OAuth Error:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return <p>An error occurred while connecting your Pinterest account. Please check the server logs for details.</p>;
    }
}