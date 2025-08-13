import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

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

        const [channels] = await connection.query(
            'SELECT channel_id, refresh_token_encrypted FROM youtube_channels WHERE user_email = ? LIMIT 1',
            [userEmail]
        );
        if (channels.length === 0) {
            throw new Error('No YouTube channel connected for this user.');
        }
        
        const { channel_id, refresh_token_encrypted } = channels[0];
        const refreshToken = decrypt(refresh_token_encrypted);

        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const { token: newAccessToken } = await oauth2Client.getAccessToken();
        oauth2Client.setCredentials({ access_token: newAccessToken });

        // The variable is defined here as `youtube` (lowercase)
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        const statsResponse = await youtube.channels.list({
            id: [channel_id],
            part: 'statistics'
        });
        const stats = statsResponse.data.items[0]?.statistics;
        
        if (stats) {
            await connection.query(
                `INSERT INTO youtube_channel_stats (user_email, channel_id, subscriber_count, view_count, video_count)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 subscriber_count = VALUES(subscriber_count), view_count = VALUES(view_count), video_count = VALUES(video_count);`,
                [userEmail, channel_id, stats.subscriberCount, stats.viewCount, stats.videoCount]
            );
        }
        
        const searchResponse = await youtube.channels.list({
            channelId: channel_id,
            part: 'snippet',
            order: 'date',
            maxResults: 25,
            type: 'video'
        });
        
        let videosUpserted = 0;
        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            const videoIds = searchResponse.data.items.map(item => item.id.videoId).filter(id => id).join(',');
            
            if (videoIds) {
                // **This is the corrected line**
                const videoDetails = await youtube.videos.list({
                    id: [videoIds],
                    part: 'snippet,statistics'
                });

                for (const video of videoDetails.data.items) {
                    await connection.query(
                        `INSERT INTO historical_social_posts (user_email, platform, platform_post_id, content, likes, impressions, posted_at)
                         VALUES (?, 'youtube', ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                         content = VALUES(content), likes = VALUES(likes), impressions = VALUES(impressions), updated_at = NOW();`,
                        [
                            userEmail,
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
        if (error.response?.data?.error_description) {
            console.error("Google API Error:", error.response.data.error_description);
            return NextResponse.json({ message: error.response.data.error_description }, { status: 500 });
        }
        console.error("Error syncing YouTube data:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}