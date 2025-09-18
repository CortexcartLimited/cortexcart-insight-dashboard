// File: src/app/api/social/facebook/sync/route.js

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
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Cooldown check (remains the same)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const [lastSync] = await connection.query(
            `SELECT created_at FROM analysis_reports WHERE user_email = ? AND report_type = 'facebook_sync' ORDER BY created_at DESC LIMIT 1`,
            [userEmail]
        );

        if (lastSync.length > 0 && new Date(lastSync[0].created_at) > fifteenMinutesAgo) {
            throw new Error('Sync is on a 15-minute cooldown. Please wait before trying again.');
        }

        // Get active page and token (remains the same)
        const [sites] = await connection.query('SELECT active_facebook_page_id FROM social_connect WHERE user_email = ?', [userEmail]);
        const pageId = sites[0]?.active_facebook_page_id;
        if (!pageId) throw new Error('No active Facebook Page has been set.');

        const [pages] = await connection.query('SELECT page_access_token_encrypted FROM social_connect WHERE page_id = ? AND user_email = ?', [pageId, userEmail]);
        if (!pages.length) throw new Error('Access token for the active page was not found.');
        
        const pageAccessToken = decrypt(pages[0].page_access_token_encrypted);

        // --- Step 1: Fetch only the posts (ID, message, time) ---
        const postsUrl = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=message,created_time&limit=25&access_token=${pageAccessToken}`;
        const postsResponse = await fetch(postsUrl);
        const postsData = await postsResponse.json();

        if (postsData.error) throw new Error(`Facebook API Error (Fetching Posts): ${postsData.error.message}`);
        
        let postsUpserted = 0;
        if (postsData.data) {
            for (const post of postsData.data) {
                // --- Step 2: For each post, fetch its insights separately ---
                const insightsMetrics = 'post_impressions_unique,post_reactions_by_type_total,post_shares';
                const insightsUrl = `https://graph.facebook.com/v19.0/${post.id}/insights?metric=${insightsMetrics}&access_token=${pageAccessToken}`;
                const insightsResponse = await fetch(insightsUrl);
                const insightsData = await insightsResponse.json();
                
                let impressions = 0, likes = 0, shares = 0;

                // Check for errors on the insights call specifically
                if (insightsData.data) {
                    const getInsightValue = (metricName) => insightsData.data.find(i => i.name === metricName)?.values[0]?.value || 0;
                    const getLikes = () => {
                        const reactions = getInsightValue('post_reactions_by_type_total');
                        return reactions?.like || 0;
                    };
                    impressions = getInsightValue('post_impressions_unique');
                    likes = getLikes();
                    shares = getInsightValue('post_shares') || 0;
                }
                
                // --- Step 3: Save to database (remains the same) ---
                await connection.query(
                    `INSERT INTO historical_social_posts (user_email, platform, platform_post_id, content, likes, shares, impressions, posted_at)
                     VALUES (?, 'facebook', ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     likes = VALUES(likes), shares = VALUES(shares), impressions = VALUES(impressions), updated_at = NOW();`,
                    [userEmail, post.id, post.message || '', likes, shares, impressions, new Date(post.created_time)]
                );
                postsUpserted++;
            }
        }
        
        // Log sync and commit (remains the same)
        await connection.query(`INSERT INTO analysis_reports (user_email, report_type) VALUES (?, 'facebook_sync')`, [userEmail]);
        await connection.commit();
        
        return NextResponse.json({ message: `Sync complete. ${postsUpserted} posts from Facebook were updated or added.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error syncing Facebook posts:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}