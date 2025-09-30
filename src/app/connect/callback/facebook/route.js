// src/app/connect/callback/facebook/route.js

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return redirect('/login');

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const userEmail = session.user.email;
    const redirectUrl = '/settings/social-connections';

    if (!code) return redirect(`${redirectUrl}?error=facebook_denied`);

    try {
        // Step 1: Exchange code for a user access token
        const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token`;
        const tokenParams = new URLSearchParams({
            client_id: process.env.FACEBOOK_CLIENT_ID,
            redirect_uri: `${process.env.NEXTAUTH_URL}/connect/callback/facebook`,
            client_secret: process.env.FACEBOOK_CLIENT_SECRET,
            code: code,
        });
        const tokenRes = await axios.get(`${tokenUrl}?${tokenParams.toString()}`);
        const userAccessToken = tokenRes.data.access_token;
        if (!userAccessToken) throw new Error('Failed to retrieve user access token.');

        // Step 2: Fetch all pages and their own page access tokens
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts`;
        const pagesParams = new URLSearchParams({
            fields: 'id,name,access_token,instagram_business_account{id,username}',
            access_token: userAccessToken,
        });
        const pagesRes = await axios.get(`${pagesUrl}?${pagesParams.toString()}`);
        const pagesData = pagesRes.data.data;

        if (!pagesData || pagesData.length === 0) {
            throw new Error('No Facebook pages found for this account.');
        }

        // Step 3: Save each page as a separate entry in social_connect
        for (const page of pagesData) {
            const query = `
                INSERT INTO social_connect (user_email, platform, page_id, page_access_token_encrypted)
                VALUES (?, 'facebook', ?, ?)
                ON DUPLICATE KEY UPDATE
                    page_access_token_encrypted = VALUES(page_access_token_encrypted);
            `;
            await db.query(query, [userEmail, page.id, encrypt(page.access_token)]);

            if (page.instagram_business_account) {
                const ig = page.instagram_business_account;
                const igQuery = `
                    INSERT INTO instagram_accounts (user_email, page_id, instagram_id, username)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        page_id = VALUES(page_id),
                        username = VALUES(username);
                `;
                await db.query(igQuery, [userEmail, page.id, ig.id, ig.username]);
            }
        }

    } catch (error) {
        console.error('[FACEBOOK CALLBACK] CRITICAL ERROR:', error);
        return redirect(`${redirectUrl}?error=${encodeURIComponent(error.message)}`);
    }

    return redirect(`${redirectUrl}?success=facebook_connected`);
}