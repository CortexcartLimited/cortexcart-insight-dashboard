// src/app/api/social/connections/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Ensure this API route always fetches fresh data.
export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        // Fetch all social connections from the 'social_connect' table
        const [socialRows] = await db.query(
            'SELECT platform FROM social_connect WHERE user_email = ?',
            [userEmail]
        );
        const connectedPlatforms = new Set(socialRows.map(row => row.platform));

        // Fetch Instagram connection separately, as it might be in its own table
        // or has specific details that aren't just 'platform' in social_connect.
        // Assuming instagram_accounts table contains the connection status for Instagram.
        const [instagramRows] = await db.query(
            `SELECT 1 FROM instagram_accounts WHERE user_email = ? LIMIT 1`,
            [userEmail]
        );
        const isInstagramConnected = instagramRows.length > 0;

        // Build the response in the array format the SocialConnectionsClient expects.
        // Each entry should be an object with 'platform' and 'status'.
        const connections = [];

        // Check for 'X' (Twitter)
        if (connectedPlatforms.has('x')) {
            connections.push({ platform: 'x', status: 'connected' });
        }

        // Check for Facebook. Note: 'facebook' and 'facebook-page' are both relevant.
        if (connectedPlatforms.has('facebook') || connectedPlatforms.has('facebook-page')) {
            connections.push({ platform: 'facebook', status: 'connected' });
        }

        // Check for Pinterest
        if (connectedPlatforms.has('pinterest')) {
            connections.push({ platform: 'pinterest', status: 'connected' });
        }

        // Check for Instagram
        if (isInstagramConnected) {
            connections.push({ platform: 'instagram', status: 'connected' });
        }

        // Check for YouTube
        if (connectedPlatforms.has('youtube')) {
            connections.push({ platform: 'youtube', status: 'connected' });
        }
        
        // The client component expects an array of connection objects.
        // We'll return it wrapped in a 'connections' property, as expected by the client.
        return NextResponse.json({ connections: connections });

    } catch (error) {
        console.error("Error loading social connection statuses:", error);
        return NextResponse.json({ error: 'Failed to load social connection statuses.' }, { status: 500 });
    }
}