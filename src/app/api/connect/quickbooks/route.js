// src/app/api/connect/quickbooks/route.js

import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
    
    // Scopes determine what data your app can access.
    // 'com.intuit.quickbooks.accounting' is common for accessing core accounting features.
    const scopes = 'com.intuit.quickbooks.accounting';

    const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${redirectUri}&state=${'your_secure_random_state_string'}`;

    // Redirect the user to the QuickBooks authorization URL.
    return NextResponse.redirect(authUrl);
}