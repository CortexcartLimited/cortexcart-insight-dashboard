// src/app/api/social/facebook/connect-page/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/crypto'; // Make sure to import encrypt

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId, pageName, pageAccessToken } = await req.json();

    if (!pageId || !pageName || !pageAccessToken) {
        return NextResponse.json({ error: 'Missing page details.' }, { status: 400 });
    }

    try {
        // Encrypt the page access token before storing it
        const encryptedPageAccessToken = encrypt(pageAccessToken);

        // First, clear any previously active page for this user
        await db.query(
            `UPDATE social_connect SET active_facebook_page_id = NULL WHERE user_email = ? AND platform = 'facebook'`,
            [session.user.email]
        );

        // Now, update the connection with the new page details AND set it as active
        await db.query(
            `UPDATE social_connect 
             SET 
                page_id = ?, 
                page_access_token_encrypted = ?,
                active_facebook_page_id = ? 
             WHERE user_email = ? AND platform = 'facebook'`,
            [pageId, encryptedPageAccessToken, pageId, session.user.email]
        );

        return NextResponse.json({ success: true, message: `Successfully connected to page: ${pageName}` });

    } catch (error) {
        console.error("Error connecting Facebook page:", error);
        return NextResponse.json({ error: 'Failed to connect Facebook page.' }, { status: 500 });
    }
}