// src/app/api/social/youtube/sync/route.js

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto'; // Assuming encrypt is needed for token updates

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const [lastSync] = await connection.query(
            `SELECT created_at FROM analysis_reports WHERE user_email = ? AND report_type = 'youtube_sync' ORDER BY created_at DESC LIMIT 1`,
            [userEmail]
        );
        if (lastSync.length > 0 && new Date(lastSync[0].created_at) > fifteenMinutesAgo) {
            throw new Error('Sync is on a 15-minute cooldown. Please wait before trying again.');
        }

        // Fetch the REFRESH token from the main social_connect table now
        const [socialConnect] = await connection.query(
            'SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = "youtube" LIMIT 1',
            [userEmail]
        );

        if (socialConnect.length === 0 || !socialConnect[0].refresh_token_encrypted) {
            throw new Error('YouTube connection not found or refresh token is missing.');
        }
        
        const refreshToken = decrypt(socialConnect[0].refresh_token_encrypted);

        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const { token: newAccessToken } = await oauth2Client.getAccessToken();
        oauth2Client.setCredentials({ access_token: newAccessToken });

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        // Get the user's channel ID
        const channelsResponse = await youtube.channels.list({
            mine: true,
            part: 'id,statistics'
        });

        if (!channelsResponse.data.items || channelsResponse.data.items.length === 0) {
             throw new Error('No YouTube channel found for this account.');
        }

        const channel = channelsResponse.data.items[0];
        const channel_id = channel.id;
        const stats = channel.statistics;
        
        // Update channel stats
        if (stats) {
            await connection.query(
                `INSERT INTO youtube_channel_stats (user_email, channel_id, subscriber_count, view_count, video_count)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 subscriber_count = VALUES(subscriber_count), view_count = VALUES(view_count), video_count = VALUES(video_count);`,
                [userEmail, channel_id, stats.subscriberCount, stats.viewCount, stats.videoCount]
            );
        }
        
        // --- THIS IS THE CORRECTED LOGIC TO FETCH VIDEOS ---
        const searchResponse = await youtube.search.list({
            channelId: channel_id,
            part: 'snippet',
            order: 'date',
            maxResults: 25, // Fetch the 25 most recent videos
            type: 'video'
        });
        
        let videosUpserted = 0;
        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            const videoIds = searchResponse.data.items.map(item => item.id.videoId).filter(id => id).join(',');
            
            if (videoIds) {
                const videoDetailsResponse = await youtube.videos.list({
                    id: videoIds, // Correct parameter format
                    part: 'snippet,statistics'
                });

                for (const video of videoDetailsResponse.data.items) {
                    await connection.query(
                        `INSERT INTO historical_social_posts (user_email, platform, platform_post_id, content, likes, impressions, posted_at)
                         VALUES (?, 'youtube', ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                         content = VALUES(content), likes = VALUES(likes), impressions = VALUES(impressions), updated_at = NOW();`,
                        [
                            userEmail, // This was the missing user_email
                            video.id,
                            video.snippet.title,
                            video.statistics.likeCount || 0,
                            video.statistics.viewCount || 0,
                            new Date(video.snippet.publishedAt)
                        ]
                    );
                    videosUpserted++;
                }
            }
        }

        await connection.query(`INSERT INTO analysis_reports (user_email, report_type) VALUES (?, 'youtube_sync')`,[userEmail]);
        await connection.commit();

        return NextResponse.json({ message: `Sync complete. ${videosUpserted} videos and channel stats were updated.` });

    } catch (error) {
        if (connection) await connection.rollback();
        const errorMessage = error.response?.data?.error_description || error.message;
        console.error("Error syncing YouTube data:", errorMessage);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}