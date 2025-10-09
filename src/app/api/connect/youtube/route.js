// src/app/api/connect/youtube/route.js

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {

    // --- FIX #1: Create the full, absolute redirect URI ---
    // This dynamically creates the correct URL for production or development.
    const redirectUri = process.env.NODE_ENV === 'production'
        ? `${process.env.NEXTAUTH_URL}/api/connect/callback/youtube`
        : 'http://localhost:3000/api/connect/callback/youtube';

    // --- FIX #2: Use the correct environment variables ---
    // Ensure these match what's in your .env file (GOOGLE_CLIENT_ID, not YOUTUBE_CLIENT_ID)
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        // --- FIX #3: Explicitly add the missing parameter ---
        // This guarantees the parameter is never missed.
        response_type: 'code',
    });

    return NextResponse.redirect(authorizationUrl);
}