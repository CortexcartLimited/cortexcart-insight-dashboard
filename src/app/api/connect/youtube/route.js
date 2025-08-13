import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import crypto from 'crypto';

export async function GET() {
    // HARDCODE the URI for this test
    const redirectUri = 'http://localhost:3000/connect/callback/youtube';

    const oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        redirectUri 
    );
    // ... rest of the file is identical
    const state = crypto.randomBytes(16).toString('hex');
    const scopes = ['https://www.googleapis.com/auth/youtube.readonly'];

    const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: state
    });

    const response = NextResponse.redirect(authorizationUrl);
    
         response.cookies.set('facebook_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            domain: '.cortexcart.com' // Set the root domain here
        });


    return response;
}