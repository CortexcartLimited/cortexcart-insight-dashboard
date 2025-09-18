// src/app/api/social/connections/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // This single query fetches all connection data from our source of truth.
        const [rows] = await db.query(
            `SELECT platform, access_token_encrypted, active_facebook_page_id, active_instagram_account_id 
             FROM social_connect 
             WHERE user_email = ?`,
            [session.user.email]
        );

        // Initialize a status object with all platforms disconnected.
        const statuses = {
            facebook: { isConnected: false, activePageId: null },
            instagram: { isConnected: false, activeAccountId: null },
            youtube: { isConnected: false },
            pinterest: { isConnected: false },
            x: { isConnected: false },
        };

        // Populate the status object with data from the database.
        for (const row of rows) {
            if (statuses[row.platform]) {
                statuses[row.platform].isConnected = !!row.access_token_encrypted;
                if (row.platform === 'facebook') {
                    statuses.facebook.activePageId = row.active_facebook_page_id;
                }
                if (row.platform === 'instagram') {
                    statuses.instagram.activeAccountId = row.active_instagram_account_id;
                }
            }
        }

        return NextResponse.json(statuses);

    } catch (error) {
        console.error("Error fetching social connection statuses:", error);
        // Return a default "all disconnected" state on error to prevent crashes.
        return NextResponse.json({
            facebook: { isConnected: false },
            instagram: { isConnected: false },
            youtube: { isConnected: false },
            pinterest: { isConnected: false },
            x: { isConnected: false },
        }, { status: 500 });
    }
}