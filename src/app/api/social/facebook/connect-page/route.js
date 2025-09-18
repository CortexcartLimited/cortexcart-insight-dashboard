// src/app/api/social/facebook/connect-page/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/crypto';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId, pageName, pageAccessToken } = await req.json();

    if (!pageId || !pageAccessToken) {
        return NextResponse.json({ error: 'Missing page ID or Access Token.' }, { status: 400 });
    }

    try {
        const encryptedPageAccessToken = encrypt(pageAccessToken);

        // This is the only query we need. It updates the single, authoritative
        // connection record in the 'social_connect' table using the correct column 'user_email'.
        await db.query(
            `UPDATE social_connect 
             SET 
                page_id = ?, 
                page_access_token_encrypted = ?,
                active_facebook_page_id = ? 
             WHERE user_email = ? AND platform = 'facebook'`,
            [pageId, encryptedPageAccessToken, pageId, session.user.email]
        );

        return NextResponse.json({ success: true, message: `Active page set to: ${pageName}` });

    } catch (error) {
        console.error("Error in connect-page API:", error);
        return NextResponse.json({ error: 'Failed to set active Facebook page.' }, { status: 500 });
    }
}