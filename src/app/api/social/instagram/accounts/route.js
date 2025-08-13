// File: src/app/api/social/instagram/accounts/route.js

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
        // 1. Get the user's main access token
        const [connections] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'facebook']
        );
        if (!connections.length) throw new Error('Facebook account not connected.');
        const accessToken = decrypt(connections[0].access_token_encrypted);

        // 2. Get the list of Facebook pages the user manages
        const pagesUrl = `https://graph.facebook.com/me/accounts?access_token=${accessToken}&fields=id,name`;
        const pagesResponse = await fetch(pagesUrl);
        const pagesData = await pagesResponse.json();
        if (pagesData.error) throw new Error(pagesData.error.message);

        // 3. For each page, find the linked Instagram Business Account
        const instagramAccounts = [];
        for (const page of pagesData.data) {
            const igUrl = `https://graph.facebook.com/${page.id}?fields=instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
            const igResponse = await fetch(igUrl);
            const igData = await igResponse.json();
            if (igData.instagram_business_account) {
                instagramAccounts.push(igData.instagram_business_account);
            }
        }

        return NextResponse.json(instagramAccounts, { status: 200 });

    } catch (error) {
        console.error('Error fetching Instagram accounts:', error);
        return NextResponse.json({ message: `Failed to fetch accounts: ${error.message}` }, { status: 500 });
    }
}