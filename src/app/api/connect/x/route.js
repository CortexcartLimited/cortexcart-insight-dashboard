import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Helper function to create a Base64 URL-safe string
function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export async function GET() {
    try {
        // 1. Generate secure random values for state and PKCE
        const state = base64URLEncode(crypto.randomBytes(32));
        const codeVerifier = base64URLEncode(crypto.randomBytes(32));
        const codeChallenge = base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest());

        // 2. Define all parameters for the authorization URL
        const callbackURL = `${process.env.NEXTAUTH_URL}/connect/callback/twitter`;
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: process.env.X_CLIENT_ID,
            redirect_uri: callbackURL,
            scope: 'tweet.read users.read tweet.write users.read offline.access',
            state: state, 
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

        // 3. Manually create the redirect response
        const response = new NextResponse(null, {
            status: 307, // Temporary Redirect
            headers: {
                Location: twitterAuthUrl,
            },
        });

        // 4. Attach the security cookies to the response
        response.cookies.set('x_oauth_state', state, { httpOnly: true, path: '/' });
        response.cookies.set('x_oauth_code_verifier', codeVerifier, { httpOnly: true, path: '/' });
        response.cookies.set('twitter_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            domain: '.cortexcart.com' // Set the root domain here
        });

        return response;

    } catch (error) {
        console.error("Error in manual Twitter auth route:", error);
        return NextResponse.json({ message: 'Error generating auth link.' }, { status: 500 });
    }
}