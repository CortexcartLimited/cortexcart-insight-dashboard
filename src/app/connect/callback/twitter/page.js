import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import Link from 'next/link';
import { getUserSubscription } from "@/lib/userSubscription"; //
import { getPlanDetails } from "@/lib/plans"; //
import { NextResponse } from 'next/server';

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

        // --- START PLAN LIMIT CHECK ---
try { // Wrap check in try/catch for DB errors

    // 1. Fetch User's Plan Details
    const subscription = await getUserSubscription(userEmail);
    const userPlan = getPlanDetails(subscription?.stripePriceId); // Gets plan or default
    const maxConnections = userPlan?.limits?.maxSocialConnections ?? 0;

    // 2. Fetch Current Active Connections Count (Using corrected query)
    const [countRows] = await db.query(
        `SELECT COUNT(*) as count
         FROM social_connect
         WHERE user_email = ?
           AND platform IN ('facebook', 'pinterest', 'instagram', 'x', 'google', 'youtube')
           AND is_active = TRUE`, // Adjust 'is_active' if needed
        [userEmail]
    );
    const currentConnections = countRows[0]?.count ?? 0;

    // 3. Check if this specific platform connection already exists and is active
    const [existingConnection] = await db.query(
         `SELECT 1 FROM social_connect WHERE user_email = ? AND platform = ? AND is_active = TRUE LIMIT 1`,
         [userEmail, 'x'] // <-- IMPORTANT: Change 'x' for other platform callbacks
    );

    // 4. Enforce Limit: Block if it's a NEW connection AND limit is reached
    if (existingConnection.length === 0 && currentConnections >= maxConnections) {
        console.warn(`LIMIT REACHED: User ${userEmail} tried to connect Twitter. Limit: ${maxConnections}, Current: ${currentConnections}.`);
        // Redirect back to settings page with an error message
        return NextResponse.redirect(new URL('/settings/social-connections?error=limit_reached', req.nextUrl.origin));
    }

     console.log(`Limit check passed for ${userEmail} connecting Twitter. Limit: ${maxConnections}, Current: ${currentConnections}, Exists: ${existingConnection.length > 0}`);

} catch (checkError) {
     console.error("Error during plan limit check:", checkError);
     // Redirect with a generic error if the check fails
     return NextResponse.redirect(new URL('/settings/social-connections?error=check_failed', req.nextUrl.origin));
}
// --- END PLAN LIMIT CHECK ---

        const query = `
            INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, expires_at, is_active)
            VALUES (?, ?, ?, ?, ?, TRUE)
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
    
     redirect('/settings/social-connections?connect_status=success');

    return null;
}