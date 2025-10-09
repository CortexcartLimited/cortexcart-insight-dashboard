// File: src/app/api/social/cron/route.js

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { decrypt, encrypt } from '@/lib/crypto';
import { TwitterApi } from 'twitter-api-v2';

async function postToX(accessToken, refreshToken, content, userEmail) {
    
    const twitterClient = new TwitterApi({ clientId: process.env.X_CLIENT_ID, clientSecret: process.env.X_CLIENT_SECRET });
    const { client: refreshedClient, accessToken: newAccessToken, refreshToken: newRefreshToken } = await twitterClient.refreshOAuth2Token(refreshToken);

    if (newRefreshToken) {
        await db.query(
            `UPDATE social_connect SET access_token_encrypted = ?, refresh_token_encrypted = ? WHERE user_email = ? AND platform = 'x'`,
            [encrypt(newAccessToken), encrypt(newRefreshToken), userEmail]
        );
    }
    
    const result = await refreshedClient.v2.tweet(content);
    return result.data.id;
}

export async function GET() {
    try {
        const connection = await db.getConnection();
        const [postsToSend] = await connection.query("SELECT * FROM scheduled_posts WHERE status = 'scheduled' AND scheduled_at <= NOW()");

        if (postsToSend.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'No posts to send.' });
        }

        for (const post of postsToSend) {
            try {
                
                const [connections] = await connection.query('SELECT * FROM social_connect WHERE user_email = ? AND platform = ?', [post.user_email, post.platform]);
                if (connections.length > 0) {
                    const conn = connections[0];
                    const refreshToken = decrypt(conn.refresh_token_encrypted);
                    let newPostId;
                    if (post.platform === 'x') {
                        newPostId = await postToX(null, refreshToken, post.content, post.user_email);
                    }
                    if (newPostId) {
                         await connection.query(
                            "UPDATE scheduled_posts SET status = 'posted', likes = 0, shares = 0, impressions = 0, platform_post_id = ? WHERE id = ?",
                            [newPostId, post.id]
                        );
                    }
                }
            } catch (postError) {
                console.error(`Failed to process post ID ${post.id}:`, postError);
                await connection.query("UPDATE scheduled_posts SET status = 'failed' WHERE id = ?", [post.id]);
            }
        }
        
        connection.release();
        return NextResponse.json({ message: `Processed ${postsToSend.length} posts.` });
    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}