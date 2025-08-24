// src/app/connect/callback/pinterest/page.js

'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

// The component needs to be async to use await
export default async function PinterestCallbackPage({ searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return redirect('/login?error=unauthenticated');
    }

    // --- THE FIX ---
    // We don't need to await searchParams itself, just use it directly
    const { code, state } = searchParams;
    // We DO need to await the cookies() calls
    const codeVerifier = (await cookies().get('pinterest_oauth_code_verifier'))?.value;
    const originalState = (await cookies().get('pinterest_oauth_state'))?.value;

    if (!code || !state || !codeVerifier || !originalState || state !== originalState) {
        return <p>Error: Invalid callback parameters. Please try connecting again.</p>;
    }

    try {
        const tokenResponse = await axios.post('https://api.pinterest.com/v5/oauth/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: new URL('/connect/callback/pinterest', process.env.NEXTAUTH_URL).toString(),
            code_verifier: codeVerifier,
        }), {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
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
        
        // Clear the cookies after use
        await cookies().delete('pinterest_oauth_state');
        await cookies().delete('pinterest_oauth_code_verifier');

        return redirect('/settings?success=pinterest_connected');
    } catch (error) {
        console.error("Pinterest OAuth Error:", error.response ? error.response.data : error.message);
        return <p>An error occurred while connecting your Pinterest account. Please try again.</p>;
    }
}