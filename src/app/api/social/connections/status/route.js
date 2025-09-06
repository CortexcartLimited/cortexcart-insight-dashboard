// src/app/api/social/connections/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get all direct connections from the social_connect table
        const [rows] = await db.query(
            'SELECT platform FROM social_connect WHERE user_email = ?',
            [session.user.email]
        );

        const connectedPlatforms = rows.map(row => row.platform);

        // 2. ✅ FIX: Check for Instagram connection through Facebook
        // If Facebook is connected, check if any Instagram accounts are stored for this user.
        if (connectedPlatforms.includes('facebook')) {
            const [instagramRows] = await db.query(
                'SELECT COUNT(*) as count FROM instagram_accounts WHERE user_email = ?',
                [session.user.email]
            );

            // If there's at least one Instagram account, add 'instagram' to our list
            if (instagramRows[0].count > 0) {
                if (!connectedPlatforms.includes('instagram')) {
                    connectedPlatforms.push('instagram');
                }
            }
        }

        // Create a status object for the frontend
        const statuses = connectedPlatforms.reduce((acc, platform) => {
            acc[platform] = true;
            return acc;
        }, {});


        return NextResponse.json(statuses);

    } catch (error) {
        console.error('Error fetching connection statuses:', error);
        return NextResponse.json({ error: 'Failed to fetch connection statuses' }, { status: 500 });
    }
}