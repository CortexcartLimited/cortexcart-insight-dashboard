// src/app/api/social/facebook/pages/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ pages: [], error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        const [userRows] = await db.query(
            `SELECT access_token_encrypted FROM users WHERE email = ?`,
            [userEmail]
        );

        if (userRows.length === 0 || !userRows[0].access_token_encrypted) {
            return NextResponse.json({ pages: [], error: 'Facebook account not fully connected. Please try reconnecting your account in settings.' }, { status: 404 });
        }
        const accessToken = decrypt(userRows[0].access_token_encrypted);

        const [connectRows] = await db.query(
            `SELECT active_facebook_page_id FROM social_connect WHERE user_email = ? AND platform = 'facebook' AND active_facebook_page_id IS NOT NULL LIMIT 1`,
            [userEmail]
        );
        const activePageId = connectRows.length > 0 ? connectRows[0].active_facebook_page_id : null;

        const fbResponse = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: { fields: 'id,name', access_token: accessToken }
        });

        const pages = fbResponse.data?.data || [];
        
        return NextResponse.json({ pages, activePageId });

    } catch (error) {
        console.error("Error fetching Facebook pages:", error);
        const errorMessage = error.response?.data?.error?.message || 'An unexpected server error occurred while fetching pages.';
        return NextResponse.json({ pages: [], error: errorMessage, details: error.message }, { status: 500 });
    }
}