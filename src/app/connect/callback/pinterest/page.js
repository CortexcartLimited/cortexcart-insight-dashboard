import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export const runtime = 'nodejs';

export default async function PinterestCallbackPage({ searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect('/api/auth/signin');
    }

    const { code, state } = searchParams;
    const codeVerifier = cookies().get('pinterest_oauth_code_verifier')?.value;
    const originalState = cookies().get('pinterest_oauth_state')?.value;

    if (!code || !state || !codeVerifier || !originalState || state !== originalState) {
        // You can create a more generic error display component if you like
        return new Response('Error: Invalid callback parameters', { status: 400 });
    }

    try {
        const tokenUrl = 'https://api.pinterest.com/v5/oauth/token';

        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            code_verifier: codeVerifier,
            redirect_uri: `${process.env.NEXTAUTH_URL}/connect/callback/pinterest`,
        });

        const basicAuth = Buffer.from(`${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`).toString('base64');

        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: body.toString(),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`Token request failed: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        const { access_token, refresh_token, expires_in } = tokenData;
        
        const userEmail = session.user.email;
        const encryptedAccessToken = encrypt(access_token);
        const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;
        const expiresAt = new Date(Date.now() + expires_in * 1000);

        const query = `
            INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                access_token_encrypted = VALUES(access_token_encrypted),
                refresh_token_encrypted = VALUES(refresh_token_encrypted),
                expires_at = VALUES(expires_at);
        `;
        // Note the platform is 'pinterest'
        await db.query(query, [userEmail, 'pinterest', encryptedAccessToken, encryptedRefreshToken, expiresAt]);

    } catch (error) {
        console.error("Error during Pinterest OAuth2 callback:", error);
        return new Response(`Error connecting Pinterest: ${error.message}`, { status: 500 });
    } finally {
       await fetch(`${process.env.NEXTAUTH_URL}/api/connect/pinterest/clear-cookies`, { method: 'POST' });
        }
    
    redirect('/settings?connect_status=success');
}