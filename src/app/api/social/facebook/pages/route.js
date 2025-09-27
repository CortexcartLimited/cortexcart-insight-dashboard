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
        // Find the specific access token for the Facebook platform
        const [connectRows] = await db.query(
            `SELECT access_token_encrypted, active_facebook_page_id 
             FROM social_connect 
             WHERE user_email = ? AND platform = 'facebook'
             LIMIT 1`,
            [userEmail]
        );

        if (connectRows.length === 0 || !connectRows[0].access_token_encrypted) {
            return NextResponse.json({ pages: [], error: 'Facebook account not connected or access token is missing.' }, { status: 404 });
        }

        const accessToken = decrypt(connectRows[0].access_token_encrypted);
        const activePageId = connectRows[0].active_facebook_page_id;

        const fbResponse = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: {
                fields: 'id,name',
                access_token: accessToken
            }
        });

        if (!fbResponse.data || !fbResponse.data.data) {
            return NextResponse.json({ pages: [], activePageId, error: 'No pages found for this Facebook account.' });
        }

        const pages = fbResponse.data.data.map(page => ({
            id: page.id,
            name: page.name,
        }));

        return NextResponse.json({ pages, activePageId });

    } catch (error) {
        console.error("CRITICAL Error fetching Facebook pages:", error.response ? error.response.data.error : error.message);
        const errorMessage = error.response?.data?.error?.message || 'An unexpected error occurred while fetching your pages.';
        return NextResponse.json({ pages: [], error: errorMessage, details: error.message }, { status: 500 });
    }
}