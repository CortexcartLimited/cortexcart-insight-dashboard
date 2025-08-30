// src/app/api/social/instagram/accounts/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // 1. Get the user's main Facebook access token
        const [connections] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'facebook']
        );

        if (!connections.length) {
            throw new Error('Facebook account not connected.');
        }

        const accessToken = decrypt(connections[0].access_token_encrypted);
        if (!accessToken) {
            throw new Error('Failed to decrypt access token.');
        }

        // 2. Make a single, efficient API call to get all pages and their linked Instagram accounts
        const url = `https://graph.facebook.com/me/accounts?fields=name,picture,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("Facebook Graph API Error:", data.error);
            throw new Error(data.error.message);
        }

        // 3. Filter out pages that don't have an Instagram account linked
        //    and map the data to the format the frontend expects.
        const instagramAccounts = data.data
            .filter(page => page.instagram_business_account) // Keep only pages that have an IG account
            .map(page => page.instagram_business_account);   // Extract just the IG account details

        return NextResponse.json(instagramAccounts, { status: 200 });

    } catch (error) {
        console.error('Error fetching Instagram accounts:', error);
        return NextResponse.json({ message: `Failed to fetch accounts: ${error.message}` }, { status: 500 });
    }
}