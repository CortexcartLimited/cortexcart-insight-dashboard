// File: src/app/api/social/pinterest/sync/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        const [connections] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [userEmail, 'pinterest']
        );

        if (!connections.length) {
            throw new Error('Pinterest account not connected.');
        }

        const accessToken = decrypt(connections[0].access_token_encrypted);

        // Fetch pins from the Pinterest API
        const url = `https://api.pinterest.com/v5/pins?page_size=50`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const pinData = await response.json();
        if (!response.ok) {
            throw new Error(pinData.message || 'Failed to fetch Pins.');
        }

        let postsUpserted = 0;
        if (pinData.items) {
            for (const pin of pinData.items) {
                // Pinterest API v5 for organic pins does not provide impression/share data easily.
                // We will use pin.pin_metrics_with_90d for like counts (saves).
                // For a real production app, you would need to look into Pinterest's reporting APIs for deeper analytics.
                const likes = pin.pin_metrics_with_90d?.save || 0;

                await db.query(
                    `INSERT INTO historical_social_posts (user_email, platform, platform_post_id, content, likes, shares, impressions, posted_at)
                     VALUES (?, 'pinterest', ?, ?, ?, 0, 0, ?)
                     ON DUPLICATE KEY UPDATE
                     likes = VALUES(likes);`,
                    [userEmail, pin.id, pin.title || pin.description || '', likes, new Date(pin.created_at)]
                );
                postsUpserted++;
            }
        }
        
        return NextResponse.json({ message: `Sync complete. ${postsUpserted} pins from Pinterest were updated or added.` });

    } catch (error) {
        console.error("Error syncing Pinterest pins:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}