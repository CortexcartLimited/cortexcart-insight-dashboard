import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export async function GET() {
    try {
        const state = base64URLEncode(crypto.randomBytes(32));
        const codeVerifier = base64URLEncode(crypto.randomBytes(32));
        const codeChallenge = base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest());

        const callbackURL = `${process.env.NEXTAUTH_URL}/connect/callback/pinterest`;
        
        // Note the different scopes for Pinterest
         const scopes = ['user_accounts:read', 'pins:read', 'pins:write', 'boards:read'].join(' ');

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: process.env.PINTEREST_APP_ID,
            redirect_uri: callbackURL,
            scope: scopes,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        const pinterestAuthUrl = `https://www.pinterest.com/oauth/?${params.toString()}`;

        const response = new NextResponse(null, {
            status: 307,
            headers: {
                Location: pinterestAuthUrl,
            },
        });

        // Use different cookie names to avoid conflicts with the Twitter flow
        response.cookies.set('pinterest_oauth_state', state, { httpOnly: true, path: '/' });
        response.cookies.set('pinterest_oauth_code_verifier', codeVerifier, { httpOnly: true, path: '/' });
        response.cookies.set('facebook_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            domain: '.cortexcart.com' // Set the root domain here
        });

        return response;

    } catch (error) {
        console.error("Error in Pinterest auth route:", error);
        return NextResponse.json({ message: 'Error generating auth link.' }, { status: 500 });
    }
}