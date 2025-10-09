import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

async function fetchMetricsFromX(accessToken, posts) {
    console.log('--- Simulating Fetch from X API ---');
    // In a real scenario, you would use the API keys here.
    const updatedPosts = posts.map(post => ({
        ...post,
        likes: post.likes + Math.floor(Math.random() * 5),
        shares: post.shares + Math.floor(Math.random() * 2),
        impressions: post.impressions + Math.floor(Math.random() * 50),
    }));
    return updatedPosts;
}

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { user } = session;

    try {
        const [connections] = await db.query(
            'SELECT platform, access_token, api_key_encrypted, api_secret_encrypted FROM social_connections WHERE user_email = ?',
            [user.email]
        );

        if (connections.length === 0) {
            return NextResponse.json({ message: 'No social accounts connected.' }, { status: 404 });
        }

        let totalUpdated = 0;

        for (const conn of connections) {
            const [postsToUpdate] = await db.query(
                'SELECT id, likes, shares, impressions FROM social_posts WHERE user_email = ? AND platform = ?',
                [user.email, conn.platform]
            );

            if (postsToUpdate.length === 0) continue;

            let updatedMetrics = [];
            
            // TODO: Uncomment and use these when implementing the actual API calls.
            // const apiKey = conn.api_key_encrypted ? decrypt(conn.api_key_encrypted) : null;
            // const apiSecret = conn.api_secret_encrypted ? decrypt(conn.api_secret_encrypted) : null;

            if (conn.platform === 'x') {
                updatedMetrics = await fetchMetricsFromX(conn.access_token, postsToUpdate);
            }
            
            const connection = await db.getConnection();
            await connection.beginTransaction();
            try {
                for (const post of updatedMetrics) {
                    await connection.query(
                        'UPDATE social_posts SET likes = ?, shares = ?, impressions = ? WHERE id = ?',
                        [post.likes, post.shares, post.impressions, post.id]
                    );
                    totalUpdated++;
                }
                await connection.commit();
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        }

        return NextResponse.json({ message: `Sync complete. Updated ${totalUpdated} posts.` }, { status: 200 });

    } catch (error) {
        console.error('Error during social sync:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
