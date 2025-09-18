// src/app/api/social/instagram/active-accounts/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { accountId } = await req.json();
        if (!accountId) {
            return NextResponse.json({ error: 'Account ID is required.' }, { status: 400 });
        }

        // This query now correctly uses 'user_email' to update the 'social_connect' table.
        await db.query(
            `UPDATE social_connect 
             SET active_instagram_account_id = ? 
             WHERE user_email = ? AND platform = 'instagram'`,
            [accountId, session.user.email]
        );

        return NextResponse.json({ success: true, message: 'Active Instagram account updated.' });

    } catch (error) {
        console.error("Error setting active Instagram account:", error);
        return NextResponse.json({ error: 'Failed to update active account.' }, { status: 500 });
    }
}