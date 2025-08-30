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

        // A single, more efficient API call to get pages with their linked Instagram accounts
        const url = `https://graph.facebook.com/me/accounts?fields=name,picture,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        // Filter out pages that don't have an Instagram account linked
        // and format the data for the frontend.
        const instagramAccounts = data.data
            .filter(page => page.instagram_business_account)
            .map(page => page.instagram_business_account);

        return NextResponse.json(instagramAccounts, { status: 200 });

    } catch (error) {
        console.error('Error fetching Instagram accounts:', error);
        return NextResponse.json({ message: `Failed to fetch accounts: ${error.message}` }, { status: 500 });
    }
}