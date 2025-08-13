// File: src/app/api/social/twitter/sync/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        const connection = await db.getConnection();
        
        // --- THIS IS THE NEW COOLDOWN LOGIC ---
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const [lastSync] = await connection.query(
            `SELECT created_at FROM analysis_reports WHERE user_email = ? AND report_type = 'twitter_sync' ORDER BY created_at DESC LIMIT 1`,
            [userEmail]
        );

        if (lastSync.length > 0 && new Date(lastSync[0].created_at) > fifteenMinutesAgo) {
            connection.release();
            return NextResponse.json({ message: 'You can sync with X once every 15 minutes. Please try again later.' }, { status: 429 });
        }
        // --- END OF COOLDOWN LOGIC ---

        const [connections] = await connection.query(
            'SELECT access_token_encrypted, refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [userEmail, 'x']
        );

        if (!connections.length) {
            connection.release();
            throw new Error('X (Twitter) account not connected.');
        }

        const refreshToken = decrypt(connections[0].refresh_token_encrypted);
        
        const twitterClient = new TwitterApi({ clientId: process.env.X_CLIENT_ID, clientSecret: process.env.X_CLIENT_SECRET });
        const { client: refreshedClient, accessToken: newAccessToken, refreshToken: newRefreshToken } = await twitterClient.refreshOAuth2Token(refreshToken);

        if (newRefreshToken) {
            await connection.query(
                `UPDATE social_connect SET access_token_encrypted = ?, refresh_token_encrypted = ? WHERE user_email = ? AND platform = 'x'`,
                [encrypt(newAccessToken), encrypt(newRefreshToken), userEmail]
            );
        }

        const me = await refreshedClient.v2.me();
        const userId = me.data.id;
        const timeline = await refreshedClient.v2.userTimeline(userId, { 'tweet.fields': ['public_metrics', 'created_at'], 'max_results': 50 });
        
        let postsUpserted = 0;
        if (timeline.data.data) {
            for (const tweet of timeline.data.data) {
                const { id, text, created_at, public_metrics } = tweet;
                const { like_count, retweet_count, impression_count } = public_metrics;
                await connection.query(
                    `INSERT INTO historical_social_posts (user_email, platform, platform_post_id, content, likes, shares, impressions, posted_at)
                     VALUES (?, 'x', ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE likes = VALUES(likes), shares = VALUES(shares), impressions = VALUES(impressions);`,
                    [userEmail, id, text, like_count, retweet_count, impression_count, new Date(created_at)]
                );
                postsUpserted++;
            }
        }
        
        // Log the successful sync for our rate limiter
        await connection.query(`INSERT INTO analysis_reports (user_email, report_type) VALUES (?, 'twitter_sync')`, [userEmail]);
        
        connection.release();
        return NextResponse.json({ message: `Sync complete. ${postsUpserted} posts from X were updated or added.` });

    } catch (error) {
        console.error("Error syncing Twitter timeline:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}