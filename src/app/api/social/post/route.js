// File: src/app/api/social/post/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const { platform, content } = await request.json();

    if (platform !== 'x') {
        return NextResponse.json({ message: 'This endpoint currently only supports posting to X (Twitter).' }, { status: 400 });
    }

    try {
        

        const [connections] = await db.query('SELECT * FROM social_connect WHERE user_email = ? AND platform = ?', [userEmail, platform]);
        if (connections.length === 0) throw new Error('X account not connected.');

        const connection = connections[0];
        const refreshToken = decrypt(connection.refresh_token_encrypted);

        const twitterClient = new TwitterApi({ clientId: process.env.X_CLIENT_ID, clientSecret: process.env.X_CLIENT_SECRET });
        const { client: refreshedClient, accessToken: newAccessToken, refreshToken: newRefreshToken } = await twitterClient.refreshOAuth2Token(refreshToken);

        if (newRefreshToken) {
            await db.query(`UPDATE social_connect SET access_token_encrypted = ?, refresh_token_encrypted = ? WHERE user_email = ? AND platform = 'x'`, [encrypt(newAccessToken), encrypt(newRefreshToken), userEmail]);
        }
        
        await refreshedClient.v2.tweet(content);
        return NextResponse.json({ message: 'Post sent to X successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Error posting to X:', error);
        return NextResponse.json({ message: `Failed to post to X: ${error.message}` }, { status: 500 });
    }
}