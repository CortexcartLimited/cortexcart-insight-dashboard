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
        // Fetch all relevant platform connections for the user in one go.
        const [rows] = await db.query(
            'SELECT platform, shopify_shop_name FROM social_connect WHERE user_email = ?',
            [userEmail]
        );

        // Use a Map for easy lookups.
        const connectionsMap = new Map(rows.map(row => [row.platform, row]));

        const shopifyRow = connectionsMap.get('shopify');

        // Build the response object in the format the UI expects.
        const connections = {
            shopify: {
                isConnected: !!shopifyRow,
                shopName: shopifyRow ? shopifyRow.shopify_shop_name : null,
            },
            quickbooks: {
                isConnected: connectionsMap.has('quickbooks'),
            },
            mailchimp: {
                isConnected: connectionsMap.has('mailchimp'),
            },
        };
        
        return NextResponse.json(connections);

    } catch (error) {
        console.error("Error loading platform statuses:", error);
        return NextResponse.json({ error: 'Failed to load platform statuses.' }, { status: 500 });
    }
}