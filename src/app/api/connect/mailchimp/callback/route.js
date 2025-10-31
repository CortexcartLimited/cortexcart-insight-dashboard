import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';
import { jwtVerify } from 'jose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const getStateSecret = () => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error("NEXTAUTH_SECRET is not set in environment variables.");
    }
    return new TextEncoder().encode(secret);
};

export async function GET(req) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    const redirectUrl = new URL('/settings/platforms', appUrl);
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateToken = searchParams.get('state');

    if (!code) {
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.searchParams.set('message', 'invalid_callback_code');
        return NextResponse.redirect(redirectUrl);
    }
    
    let userEmail;

    try {
        // --- THIS IS THE NEW HYBRID LOGIC ---
        // 1. First, try the standard session method (will work in production)
        const session = await getServerSession(authOptions);

        if (session && session.user) {
            userEmail = session.user.email;
        } 
        // 2. If session fails, fall back to the JWT state token (will work in development)
        else if (stateToken) {
            try {
                const { payload } = await jwtVerify(stateToken, getStateSecret());
                userEmail = payload.userEmail;
            } catch {
                // If the state token is invalid, we must stop.
                throw new Error("Invalid or expired state token.");
            }
        }

        // 3. If neither method worked, we are not authenticated.
        if (!userEmail) {
            redirectUrl.searchParams.set('connect_status', 'error');
            redirectUrl.searchParams.set('message', 'authentication_required');
            return NextResponse.redirect(redirectUrl);
        }
        // --- END OF HYBRID LOGIC ---

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', process.env.MAILCHIMP_CLIENT_ID);
        params.append('client_secret', process.env.MAILCHIMP_CLIENT_SECRET);
        params.append('redirect_uri', `${appUrl}/api/connect/mailchimp/callback`);
        params.append('code', code);

        const tokenResponse = await axios.post('https://login.mailchimp.com/oauth2/token', params);
        const { access_token } = tokenResponse.data;

        const metadataResponse = await axios.get('https://login.mailchimp.com/oauth2/metadata', {
            headers: { 'Authorization': `OAuth ${access_token}` },
        });
        const { dc } = metadataResponse.data;

        const query = `
            INSERT INTO social_connect (user_email, platform, access_token_encrypted, server_prefix, is_active)
            VALUES (?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
            access_token_encrypted = VALUES(access_token_encrypted),
            server_prefix = VALUES(server_prefix),
            is_active = 1;
        `;
        await db.query(query, [ userEmail, 'mailchimp', encrypt(access_token), dc ]);

        redirectUrl.searchParams.set('connect_status', 'success');
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("Mailchimp connection error:", error.response?.data || error.message);
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.searchParams.set('message', 'connection_failed');
        return NextResponse.redirect(redirectUrl);
    }
}