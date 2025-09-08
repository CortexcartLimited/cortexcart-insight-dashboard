// src/app/api/social/connections/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get all direct connections
        const [rows] = await db.query(
            'SELECT platform, shopify_shop_name FROM social_connect WHERE user_email = ?',
            [session.user.email]
        );

        // 2. Format the connections into a status object
        const connectedPlatforms = rows.reduce((acc, row) => {
            if (row.platform === 'shopify') {
                acc.shopify = { isConnected: true, shopName: row.shopify_shop_name };
            } else {
                acc[row.platform] = true;
            }
            return acc;
        }, {});
        
        // 3. Check for Instagram connection via Facebook
        if (connectedPlatforms.facebook) {
            // ✅ FIX: Removed the non-existent 'is_active' column from the query
            const [instagramRows] = await db.query(
                'SELECT COUNT(*) as count FROM instagram_accounts WHERE user_email = ?',
                [session.user.email]
            );

            // If any Instagram accounts exist, mark Instagram as connected
            if (instagramRows[0].count > 0) {
                connectedPlatforms.instagram = true;
            }
        }

        return NextResponse.json(connectedPlatforms);

    } catch (error) {
        console.error('Error fetching connection statuses:', error);
        return NextResponse.json({ error: 'Failed to fetch connection statuses' }, { status: 500 });
    }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let platform = '';
    try {
        const body = await req.json();
        platform = body.platform;

        if (!platform) {
            return NextResponse.json({ message: 'Platform not specified.' }, { status: 400 });
        }
        
        await db.query(
            'DELETE FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, platform]
        );

        // Clear any related cookies if necessary
        if (platform === 'pinterest') {
            cookies().delete('pinterest_oauth_state');
            cookies().delete('pinterest_oauth_code_verifier');
        }

        return NextResponse.json({ message: `${platform} disconnected successfully.` });

    } catch (error) {
        console.error(`Failed to disconnect ${platform}:`, error);
        return NextResponse.json({ message: `Failed to disconnect ${platform || 'platform'}.` }, { status: 500 });
    }
}