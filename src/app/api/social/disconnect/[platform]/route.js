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
        // Special handling for Facebook, which also manages Instagram
        if (platform === 'facebook') {
            await db.query(
                'DELETE FROM instagram_accounts WHERE user_email = ?',
                [userEmail]
            );
             await db.query(
                `UPDATE users SET access_token_encrypted = NULL, refresh_token_encrypted = NULL WHERE email = ?`,
                [userEmail]
            );
        }

        // General disconnect for all platforms from the main connection table
        await db.query(
            'DELETE FROM social_connect WHERE user_email = ? AND platform = ?',
            [userEmail, platform]
        );

        return NextResponse.json({ success: true, message: `Successfully disconnected from ${platform}.` });

    } catch (error) {
        console.error(`Error disconnecting from ${platform}:`, error);
        return NextResponse.json({ error: `Failed to disconnect from ${platform}.`, details: error.message }, { status: 500 });
    }
}