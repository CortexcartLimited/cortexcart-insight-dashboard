// src/app/api/platforms/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// This line prevents the API from returning stale, cached data.
export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        // --- Get connections from the 'social_connect' table ---
        const [socialRows] = await db.query(
            'SELECT DISTINCT platform FROM social_connect WHERE user_email = ?',
            [userEmail]
        );
        const connectedPlatforms = new Set(socialRows.map(row => row.platform));

        // --- Get Shopify connection details, including the store name ---
        const [shopifyRows] = await db.query(
            `SELECT shop as shopName FROM shopify_stores WHERE user_email = ? LIMIT 1`,
            [userEmail]
        );
        const shopifyConnection = shopifyRows.length > 0 ? shopifyRows[0] : null;

        // --- Build the response object in the format the UI expects ---
        const connections = {
            shopify: {
                isConnected: !!shopifyConnection,
                shopName: shopifyConnection ? shopifyConnection.shopName : null,
            },
            quickbooks: {
                isConnected: connectedPlatforms.has('quickbooks'),
            },
            mailchimp: {
                isConnected: connectedPlatforms.has('mailchimp'),
            },
        };
        
        return NextResponse.json(connections);

    } catch (error) {
        console.error("Error loading platform statuses:", error);
        return NextResponse.json({ error: 'Failed to load platform statuses.' }, { status: 500 });
    }
}