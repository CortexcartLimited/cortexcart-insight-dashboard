// src/app/api/connect/opencart/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        // If the user isn't logged into CortexCart, send them to login first.
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', req.url); // After login, return to this URL
        return NextResponse.redirect(loginUrl);
    }

    const { searchParams } = new URL(req.url);
    const returnUrl = searchParams.get('return_url'); // The URL to send the user back to in OpenCart

    if (!returnUrl) {
        return NextResponse.json({ error: 'Missing return_url parameter' }, { status: 400 });
    }

    // Create a secure, single-use state token
    const state = nanoid();
    const cookieStore = cookies();
    
    // Store the state and OpenCart return URL in a secure, temporary cookie
    cookieStore.set('opencart_oauth_state', JSON.stringify({ state, returnUrl }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });

    // Redirect the user to an in-app confirmation page
    const confirmationUrl = new URL('/connect/confirm-opencart', req.url);
    confirmationUrl.searchParams.set('state', state);
    return NextResponse.redirect(confirmationUrl);
}