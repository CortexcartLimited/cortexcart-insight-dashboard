// src/app/api/social/disconnect/[platform]/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = params;
    if (!platform) {
        return NextResponse.json({ error: 'Platform not specified.' }, { status: 400 });
    }

    try {
        // This query deletes the specific connection for the user and platform.
        const [result] = await db.query(
            `DELETE FROM social_connect WHERE user_email = ? AND platform = ?`,
            [session.user.email, platform]
        );

        if (result.affectedRows === 0) {
            // This case handles if they try to disconnect something not connected.
            return NextResponse.json({ message: 'No active connection to disconnect.' });
        }

        return NextResponse.json({ success: true, message: `${platform} has been disconnected.` });

    } catch (error) {
        console.error(`Error disconnecting ${platform}:`, error);
        return NextResponse.json({ error: `Failed to disconnect ${platform}.` }, { status: 500 });
    }
}