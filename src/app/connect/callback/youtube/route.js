import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    const redirectUrl = new URL('/settings/platforms/', appUrl);
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.searchParams.set('message', 'invalid_callback_code');
        return NextResponse.redirect(redirectUrl);
    }
    
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            redirectUrl.searchParams.set('connect_status', 'error');
            redirectUrl.searchParams.set('message', 'authentication_required');
            return NextResponse.redirect(redirectUrl);
        }

        const params = new URLSearchParams();
        params.append('client_id', process.env.YOUTUBE_CLIENT_ID);
        params.append('client_secret', process.env.YOUTUBE_CLIENT_SECRET);
        params.append('redirect_uri', `${appUrl}/connect/callback/youtube`);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', params);
        const { access_token, refresh_token } = tokenResponse.data;

        const query = `
            INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            access_token_encrypted = VALUES(access_token_encrypted),
            refresh_token_encrypted = VALUES(refresh_token_encrypted);
        `;
        
        await db.query(query, [ 
            session.user.email, 
            'youtube', 
            encrypt(access_token), 
            refresh_token ? encrypt(refresh_token) : null 
        ]);

        redirectUrl.searchParams.set('connect_status', 'success');
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("YouTube connection error:", error.response?.data || error.message);
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.search_params.set('message', 'connection_failed');
        return NextResponse.redirect(redirectUrl);
    }
}