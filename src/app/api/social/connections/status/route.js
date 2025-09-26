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
        const connections = {};

        // Helper function to check for a connection in the main table
        const checkConnection = async (platform) => {
            const [rows] = await db.query(
                `SELECT 1 FROM social_connect WHERE user_email = ? AND platform = ? AND access_token_encrypted IS NOT NULL LIMIT 1`,
                [userEmail, platform]
            );
            return rows.length > 0;
        };

        // Check each standard platform
        connections.x = await checkConnection('x');
        connections.facebook = await checkConnection('facebook');
        connections.pinterest = await checkConnection('pinterest');
        connections.youtube = await checkConnection('youtube');

        // Instagram is connected if an account exists in its specific table
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