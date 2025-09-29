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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        // CORRECTED: Fetches the access token from the 'social_connect' table where it is actually stored.
        const [connectRows] = await db.query(
            `SELECT access_token_encrypted, active_facebook_page_id FROM social_connect WHERE user_email = ? AND platform = 'facebook' LIMIT 1`,
            [userEmail]
        );

        if (connectRows.length === 0 || !connectRows[0].access_token_encrypted) {
            return NextResponse.json({ error: 'Facebook connection not found or access token is missing. Please try reconnecting your account.' }, { status: 404 });
        }
        
        const accessToken = decrypt(connectRows[0].access_token_encrypted);
        const activePageId = connectRows[0].active_facebook_page_id || null;

        const fbResponse = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: { fields: 'id,name', access_token: accessToken }
        });

        const pages = fbResponse.data?.data || [];

        return NextResponse.json({ pages, activePageId });

    } catch (error) {
        console.error("CRITICAL DIAGNOSTIC: Error fetching Facebook pages:", JSON.stringify(error, null, 2));

        const errorMessage = error.response?.data?.error?.message || 'An unexpected server error occurred.';
        const errorDetails = {
            message: error.message,
            code: error.code,
            response_data: error.response?.data,
        };
        
        return NextResponse.json({
            error: errorMessage,
            details: errorDetails
        }, { status: 500 });
    }
}