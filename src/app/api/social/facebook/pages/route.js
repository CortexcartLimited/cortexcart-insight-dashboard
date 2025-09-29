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
        // CORRECTED: Fetches the token and active page ID from the single 'social_connect' table.
        const [connectRows] = await db.query(
            `SELECT access_token_encrypted, active_facebook_page_id FROM social_connect WHERE user_email = ? AND platform = 'facebook' LIMIT 1`,
            [userEmail]
        );

        if (connectRows.length === 0 || !connectRows[0].access_token_encrypted) {
            return NextResponse.json({ error: 'Facebook connection not found.' }, { status: 404 });
        }
        
        const accessToken = decrypt(connectRows[0].access_token_encrypted);
        const activePageId = connectRows[0].active_facebook_page_id;

        const fbResponse = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: { fields: 'id,name', access_token: accessToken }
        });

        const pages = fbResponse.data?.data || [];
        
        return NextResponse.json({ pages, activePageId });

    } catch (error) {
        console.error("Error fetching Facebook pages:", error);
        return NextResponse.json({ error: 'An unexpected server error occurred while fetching pages.' }, { status: 500 });
    }
}