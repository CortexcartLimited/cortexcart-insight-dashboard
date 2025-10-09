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

        // --- THIS IS THE FIX ---
        // Corrected 'instagram_user_id' to 'instagram_id' to match what your database expects.
        const [accounts] = await db.query(
            'SELECT instagram_id, username, page_id FROM instagram_accounts WHERE user_email = ?',
            [session.user.email]
        );

        const accountsWithStatus = (accounts || []).map(acc => ({
            ...acc,
            // This line ensures the front-end gets the data in the format it expects.
            instagram_user_id: acc.instagram_id,
            is_active: acc.instagram_id === activeIgId,
        }));
        
        return NextResponse.json(accountsWithStatus);

    } catch (error) {
        console.error('CRITICAL Error fetching Instagram accounts:', error);
        return NextResponse.json({ 
            error: 'A database error occurred while fetching Instagram accounts.',
            details: error.message
        }, { status: 500 });
    }
}