// src/app/api/social/instagram/accounts/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [connectRows] = await db.query(
            `SELECT active_instagram_account_id FROM social_connect WHERE user_email = ? AND platform = 'facebook' LIMIT 1`,
            [session.user.email]
        );
        const activeIgId = connectRows.length > 0 ? connectRows[0].active_instagram_account_id : null;

        const [accounts] = await db.query(
            'SELECT instagram_user_id, username, page_id FROM instagram_accounts WHERE user_email = ?',
            [session.user.email]
        );

        const accountsWithStatus = (accounts || []).map(acc => ({
            ...acc,
            is_active: acc.instagram_user_id === activeIgId,
        }));
        
        return NextResponse.json(accountsWithStatus);

    } catch (error) {
        // --- THIS IS THE CRITICAL FIX ---
        // It now sends the actual database error message to the front end.
        console.error('CRITICAL Error fetching Instagram accounts:', error);
        return NextResponse.json({ 
            error: 'A database error occurred while fetching Instagram accounts.',
            details: error.message // This will tell us the specific problem
        }, { status: 500 });
    }
}