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

        // Deletes the connection from our main social table
        const [deleteResult] = await db.query(
            'DELETE FROM social_connect WHERE user_email = ? AND platform = ?',
            [userEmail, platform]
        );
        
        if (deleteResult.affectedRows === 0) {
            // This isn't a critical error, but good to know.
            console.warn(`Attempted to disconnect ${platform}, but no existing connection was found in social_connect.`);
        }

        return NextResponse.json({ success: true, message: `Successfully disconnected from ${platform}.` });

    } catch (error) {
        console.error(`Error disconnecting from ${platform}:`, error);
        return NextResponse.json({ error: `Failed to disconnect from ${platform}.` }, { status: 500 });
    }
}