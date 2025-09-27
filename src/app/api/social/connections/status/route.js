// src/app/api/social/connections/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized: No active session.' }, { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        const [rows] = await db.query(
            'SELECT platform FROM social_connect WHERE user_email = ?',
            [userEmail]
        );

        const connectedPlatforms = new Set(rows.map(row => row.platform));

        const connections = {
            x: connectedPlatforms.has('x'),
            facebook: connectedPlatforms.has('facebook'),
            pinterest: connectedPlatforms.has('pinterest'),
            youtube: connectedPlatforms.has('youtube'),
            instagram: connectedPlatforms.has('instagram'),
        };
        
        return NextResponse.json(connections);

    } catch (error) {
        console.error("CRITICAL ERROR in connections/status:", error);
        // This is the important change: send the actual error message back for debugging.
        return NextResponse.json({
            error: 'Failed to load social connection data.',
            details: error.message 
        }, { status: 500 });
    }
}