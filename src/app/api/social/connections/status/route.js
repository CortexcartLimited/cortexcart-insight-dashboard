// src/app/api/social/connections/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        const [rows] = await db.query(
            'SELECT platform FROM social_connect WHERE user_email = ? AND access_token_encrypted IS NOT NULL',
            [userEmail]
        );

        const connectedPlatforms = new Set(rows.map(row => row.platform));

        const connections = {
            x: connectedPlatforms.has('x'),
            facebook: connectedPlatforms.has('facebook'),
            pinterest: connectedPlatforms.has('pinterest'),
            youtube: connectedPlatforms.has('youtube'),
        };
        
        // Instagram is a special case, as it's linked via Facebook's page connection.
        const [igRows] = await db.query(
            `SELECT 1 FROM instagram_accounts WHERE user_email = ? LIMIT 1`,
            [userEmail]
        );
        connections.instagram = igRows.length > 0;
        
        return NextResponse.json(connections);

    } catch (error) {
        console.error("Failed to load social connection data:", error);
        return NextResponse.json({ error: 'Failed to load social connection data.' }, { status: 500 });
    }
}