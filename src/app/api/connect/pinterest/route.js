// src/app/api/connect/pinterest/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET() {
    try {
        const state = crypto.randomBytes(32).toString('hex');
        const codeVerifier = crypto.randomBytes(32).toString('hex');
        const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

        const cookieStore = await cookies();
        cookieStore.set('pinterest_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
        cookieStore.set('pinterest_oauth_code_verifier', codeVerifier, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });

        const redirectUri = new URL('/connect/callback/pinterest', process.env.NEXTAUTH_URL).toString();

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: process.env.PINTEREST_CLIENT_ID,
            redirect_uri: redirectUri,
            scope: 'boards:read pins:read user_accounts:read pins:write',
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        const authorizationUrl = `https://www.pinterest.com/oauth/?${params.toString()}`;
        
        return NextResponse.redirect(authorizationUrl);
    } catch (error) {
        console.error("Error generating Pinterest auth URL:", error);
        return NextResponse.redirect('/settings?error=pinterest_auth_start_failed');
    }
}