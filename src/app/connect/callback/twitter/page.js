import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import Link from 'next/link';

export const runtime = 'nodejs';

// This component to display errors remains the same
const DebugErrorDisplay = ({ urlState, cookieState }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md max-w-lg text-center">
                <h1 className="text-2xl font-bold text-red-600">Connection Error</h1>
                <p className="mt-2 text-gray-700">A security check failed. This can happen if you take too long to authorize the app or if your browser is blocking cookies.</p>
                <div className="mt-4 text-left bg-gray-50 p-4 rounded font-mono text-xs space-y-2">
                    <p><strong>Reason:</strong> State parameter mismatch or API error.</p>
                    <p><strong>State from Twitter:</strong> {urlState || 'Not Found'}</p>
                    <p><strong>Expected State (from cookie):</strong> {cookieState || 'Not Found'}</p>
                </div>
                <Link href="/settings">
                    <div className="mt-6 inline-block px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer">
                        Return to Settings
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default async function TwitterCallbackPage({ searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect('/api/auth/signin');
    }

    const { code, state } = searchParams;
    const codeVerifier = cookies().get('x_oauth_code_verifier')?.value;
    const originalState = cookies().get('x_oauth_state')?.value;

    if (!code || !state || !codeVerifier || !originalState || state !== originalState) {
        return <DebugErrorDisplay urlState={state} cookieState={originalState} />;
    }

    try {
        const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        const callbackURL = `${process.env.NEXTAUTH_URL}/connect/callback/twitter`;

        const body = new URLSearchParams({
            code: code,
            grant_type: 'authorization_code',
            client_id: process.env.X_CLIENT_ID,
            redirect_uri: callbackURL,
            code_verifier: codeVerifier,
        });

        const basicAuth = Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64');

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
        await db.query(query, [userEmail, 'x', encryptedAccessToken, encryptedRefreshToken, expiresAt]);

    } catch (error) {
        console.error("Error during manual X OAuth2 callback:", error);
        return <DebugErrorDisplay urlState={state} cookieState={error.message} />;
    } finally {
    // Call the new API route to clear cookies
    await fetch(`${process.env.NEXTAUTH_URL}/api/social/clear-cookies`, { method: 'POST' });
}
    
    redirect('/settings?connect_status=success');

    return null;
}