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
        // Get all distinct platform names for the user from the primary connection table
        const [rows] = await db.query(
            'SELECT DISTINCT platform FROM social_connect WHERE user_email = ? AND access_token_encrypted IS NOT NULL',
            [userEmail]
        );
        const connectedPlatforms = new Set(rows.map(row => row.platform));

        // Separately, check if any Instagram accounts are linked
        const [igRows] = await db.query(
            `SELECT 1 FROM instagram_accounts WHERE user_email = ? LIMIT 1`,
            [userEmail]
        );
        const isInstagramConnected = igRows.length > 0;

        const connections = {
            x: connectedPlatforms.has('x'),
            facebook: connectedPlatforms.has('facebook'),
            pinterest: connectedPlatforms.has('pinterest'),
            youtube: connectedPlatforms.has('youtube'),
            instagram: isInstagramConnected, // Set Instagram status based on its own table
        };
        
        return NextResponse.json(connections);

    } catch (error) {
        console.error("Error loading social connection statuses:", error);
        return NextResponse.json({ 
            error: 'Failed to load social connection statuses.', 
            details: error.message 
        }, { status: 500 });
    }
}