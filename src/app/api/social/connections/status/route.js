// src/app/api/social/connections/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        // --- Get social connections from various tables ---
        const [socialRows] = await db.query(
            'SELECT DISTINCT platform FROM social_connect WHERE user_email = ?',
            [userEmail]
        );
        const connectedPlatforms = new Set(socialRows.map(row => row.platform));

        const [igRows] = await db.query(
            `SELECT 1 FROM instagram_accounts WHERE user_email = ? LIMIT 1`,
            [userEmail]
        );
        
        // --- Build response in the array format the social connections page expects ---
        const connectionsArray = [];
        
        if (connectedPlatforms.has('x')) {
            connectionsArray.push({ platform: 'x', status: 'connected' });
        }
        
        const isFacebookConnected = connectedPlatforms.has('facebook') || connectedPlatforms.has('facebook-page');
        if (isFacebookConnected) {
            connectionsArray.push({ platform: 'facebook', status: 'connected' });
        }
        
        if (connectedPlatforms.has('pinterest')) {
            connectionsArray.push({ platform: 'pinterest', status: 'connected' });
        }
        
        if (connectedPlatforms.has('youtube')) {
            connectionsArray.push({ platform: 'youtube', status: 'connected' });
        }
        
        if (igRows.length > 0) {
            connectionsArray.push({ platform: 'instagram', status: 'connected' });
        }
        
        // The UI expects the array inside a 'connections' property
        return NextResponse.json({ connections: connectionsArray });

    } catch (error) {
        console.error("Error loading social connection statuses:", error);
        return NextResponse.json({ error: 'Failed to load connection statuses.' }, { status: 500 });
    }
}