// src/app/api/social/disconnect/[platform]/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = params;
    const userEmail = session.user.email;

    try {
        if (platform === 'facebook') {
            // When disconnecting Facebook, also remove any linked Instagram accounts
            await db.query('DELETE FROM instagram_accounts WHERE user_email = ?', [userEmail]);
        }

        // CORRECTED: Deletes only from the 'social_connect' table that we know exists.
        await db.query(
            'DELETE FROM social_connect WHERE user_email = ? AND platform = ?',
            [userEmail, platform]
        );

        return NextResponse.json({ success: true, message: `Successfully disconnected from ${platform}.` });

    } catch (error) {
        console.error(`Error disconnecting from ${platform}:`, error);
        return NextResponse.json({ error: `Failed to disconnect from ${platform}.` }, { status: 500 });
    }
}