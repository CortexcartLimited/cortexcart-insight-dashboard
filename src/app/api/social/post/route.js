// src/app/api/social/post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, content } = await req.json();
    const userEmail = session.user.email;

    try {
        const [rows] = await db.query(
            'SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [userEmail, platform]
        );

        if (rows.length === 0 || !rows[0].refresh_token_encrypted) {
            return NextResponse.json({ error: `${platform} account not connected or refresh token is missing.` }, { status: 404 });
        }

        const refreshToken = decrypt(rows[0].refresh_token_encrypted);

        if (platform === 'x') {
            const twitterClient = new TwitterApi({
                clientId: process.env.X_CLIENT_ID,
                clientSecret: process.env.X_CLIENT_SECRET,
            });

            const { client: refreshedClient, accessToken: newAccessToken, refreshToken: newRefreshToken } = await twitterClient.refreshOAuth2Token(refreshToken);
            
            if (newAccessToken && newRefreshToken) {
                await db.query(
                    'UPDATE social_connect SET access_token_encrypted = ?, refresh_token_encrypted = ? WHERE user_email = ? AND platform = ?',
                    [encrypt(newAccessToken), encrypt(newRefreshToken), userEmail, 'x']
                );
            }

            await refreshedClient.v2.tweet(content);
            return NextResponse.json({ message: 'Post successful!' });
        }
        
        return NextResponse.json({ message: 'Platform not supported yet.' }, { status: 400 });

    } catch (error) {
        // --- START NEW ERROR HANDLING ---
        
        // This checks for the specific error that means the user needs to reconnect.
        // For Twitter, the error often includes the text "invalid_grant".
        const errorMessage = error.data?.error_description || '';
        if (error.code === 400 && errorMessage.includes('invalid_grant')) {
            console.error(`Re-authentication required for ${platform} for user ${userEmail}.`);
            return NextResponse.json({
                error: `Your connection to ${platform} has expired. Please go to your settings and reconnect your account.`
            }, { status: 401 }); // 401 Unauthorized is a more appropriate status code here
        }

        // --- END NEW ERROR HANDLING ---

        // This is the fallback for all other types of errors (e.g., duplicate tweet)
        console.error(`Error posting to ${platform}:`, error);
        if (error.data) {
            console.error('Detailed API Error:', JSON.stringify(error.data, null, 2));
        }
        
        return NextResponse.json({
            error: `Failed to post to ${platform}. Reason: ${error.data?.detail || error.message}`
        }, { status: 500 });
    }
}