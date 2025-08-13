// src/app/api/connect/mailchimp/route.js (Corrected)

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt'; // Use getToken to access the JWT
import { SignJWT } from 'jose';

const getStateSecret = () => {
    const secret = process.env.NEXTAUTH_SECRET;
    return new TextEncoder().encode(secret);
};

export async function GET(req) {
    // --- THIS IS THE KEY FIX ---
    // We use getToken() here to get the full JWT, which contains the user's ID in the 'sub' field.
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.sub) {
        return NextResponse.redirect(new URL('/settings?connect_status=error&message=session_error', req.url));
    }

    // Now we create the state token with the correct user ID from token.sub
    const stateToken = await new SignJWT({ userId: token.sub, userEmail: token.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(getStateSecret());

    const clientId = process.env.MAILCHIMP_CLIENT_ID;
    const redirectUri = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/connect/mailchimp/callback';
    
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state: stateToken,
    });

    const authUrl = `https://login.mailchimp.com/oauth2/authorize?${params.toString()}`;

    return NextResponse.redirect(authUrl);
}