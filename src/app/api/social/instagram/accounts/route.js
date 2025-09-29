// src/app/api/social/instagram/accounts/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json([], { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        // Get the active Instagram ID from the main social_connect row for Facebook
        const [connectRows] = await db.query(
            `SELECT active_instagram_account_id FROM social_connect WHERE user_email = ? AND platform = 'facebook' LIMIT 1`,
            [userEmail]
        );
        const activeIgId = connectRows.length > 0 ? connectRows[0].active_instagram_account_id : null;

        // Get all linked Instagram accounts
        const [accounts] = await db.query(
            `SELECT instagram_user_id, username, page_id FROM instagram_accounts WHERE user_email = ?`,
            [userEmail]
        );
        
        // Add the 'is_active' flag to each account
        const accountsWithStatus = accounts.map(acc => ({
            ...acc,
            is_active: acc.instagram_user_id === activeIgId,
        }));

        return NextResponse.json(accountsWithStatus);
    } catch (error) {
        console.error("Error fetching Instagram accounts:", error);
        return NextResponse.json({ error: 'Failed to fetch Instagram accounts.' }, { status: 500 });
    }
}