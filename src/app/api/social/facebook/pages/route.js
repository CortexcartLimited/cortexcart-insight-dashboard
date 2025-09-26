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
        return NextResponse.json({ pages: [], activePageId: null, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Correctly get the user's main access token and the active page ID from the social_connect table
        const [rows] = await db.query(
            `SELECT access_token_encrypted, active_facebook_page_id 
             FROM social_connect 
             WHERE user_email = ? AND platform = 'facebook' 
             LIMIT 1`, // Assuming one primary connection row per user for Facebook
            [session.user.email]
        );

        if (rows.length === 0 || !rows[0].access_token_encrypted) {
            return NextResponse.json({ pages: [], activePageId: null, error: 'Facebook account not connected.' });
        }

        const accessToken = decrypt(rows[0].access_token_encrypted);
        const activePageId = rows[0].active_facebook_page_id;

        const fbResponse = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: { 
                fields: 'id,name,access_token', // Request page access token as well
                access_token: accessToken 
            }
        });

        const pages = fbResponse.data.data.map(page => ({
            id: page.id,
            name: page.name,
            isActive: page.id === activePageId,
        }));

        return NextResponse.json({ pages, activePageId });

    } catch (error) {
        console.error("Error fetching Facebook pages:", error.response ? error.response.data.error : error.message);
        const errorMessage = error.response?.data?.error?.message || 'Failed to fetch Facebook pages.';
        return NextResponse.json({ pages: [], activePageId: null, error: errorMessage }, { status: 500 });
    }
}