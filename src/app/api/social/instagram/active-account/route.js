// src/app/api/social/instagram/active-account/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { instagramId } = await req.json();
    const userEmail = session.user.email;

    try {
        // Updates the 'active_instagram_account_id' column in the 'social_connect' table.
        const [updateResult] = await db.query(
            `UPDATE social_connect SET active_instagram_account_id = ? WHERE user_email = ? AND platform = 'facebook'`,
            [instagramId, userEmail]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error('Could not find the social_connect entry for Facebook to update.');
        }

        return NextResponse.json({ success: true, message: 'Active Instagram account updated.' });
    } catch (error)
{
        console.error("Error setting active Instagram account:", error);
        return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
    }
}