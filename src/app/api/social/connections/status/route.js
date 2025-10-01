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
        // --- Social & E-commerce Connections from 'social_connect' table ---
        const [socialRows] = await db.query(
            'SELECT DISTINCT platform FROM social_connect WHERE user_email = ?',
            [userEmail]
        );
        const connectedPlatforms = new Set(socialRows.map(row => row.platform));

        // --- Instagram (special case) ---
        const [igRows] = await db.query(
            `SELECT 1 FROM instagram_accounts WHERE user_email = ? LIMIT 1`,
            [userEmail]
        );
        
        // --- Shopify (uses its own table) ---
        const [shopifyRows] = await db.query(
            `SELECT 1 FROM shopify_stores WHERE user_email = ? LIMIT 1`,
            [userEmail]
        );

        // A user is connected to Facebook if a 'facebook' OR 'facebook-page' record exists.
        const isFacebookConnected = connectedPlatforms.has('facebook') || connectedPlatforms.has('facebook-page');

        const connections = {
            // Social Platforms
            x: connectedPlatforms.has('x'),
            facebook: isFacebookConnected,
            pinterest: connectedPlatforms.has('pinterest'),
            youtube: connectedPlatforms.has('youtube'),
            instagram: igRows.length > 0,
            
            // Integration Platforms
            shopify: shopifyRows.length > 0,
            quickbooks: connectedPlatforms.has('quickbooks'),
            mailchimp: connectedPlatforms.has('mailchimp'),
        };
        
        return NextResponse.json(connections);

    } catch (error) {
        console.error("Error loading all connection statuses:", error);
        return NextResponse.json({ error: 'Failed to load connection statuses.' }, { status: 500 });
    }
}