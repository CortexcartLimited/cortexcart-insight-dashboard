// src/app/api/social/instagram/accounts/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

// --- START OF FIX ---
// This tells Next.js to always run this route dynamically
// and not to cache its response.
export const dynamic = 'force-dynamic';
// --- END OF FIX ---

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        // 1. Get all Instagram accounts linked to the user from the 'instagram_accounts' table
        const [accounts] = await db.query(
            `SELECT * FROM instagram_accounts WHERE user_email = ?`,
            [userEmail]
        );

        // 2. Get the SINGLE 'instagram' platform row from 'social_connect'
        //    This row holds the 'active_instagram_user_id'
        const [socialConnectRow] = await db.query(
            `SELECT active_instagram_user_id FROM social_connect WHERE user_email = ? AND platform = 'instagram' LIMIT 1`,
            [userEmail]
        );

        // Determine the active ID
        const activeId = socialConnectRow.length > 0 ? socialConnectRow[0].active_instagram_user_id : null;

        // 3. Combine the information
        //    We map over the accounts and add an 'is_active' property
        const accountsWithActiveState = accounts.map(account => ({
            ...account,
            // 'account.instagram_id' is a string/BigInt, 'activeId' is also a string/BigInt.
            // Let's ensure a safe comparison.
            is_active: activeId ? account.instagram_id.toString() === activeId.toString() : false
        }));
        
        // This is what the frontend component receives
        return NextResponse.json(accountsWithActiveState);

    } catch (error) {
        console.error('Failed to fetch Instagram accounts:', error);
        return NextResponse.json({ error: 'Failed to fetch Instagram accounts.' }, { status: 500 });
    }
}