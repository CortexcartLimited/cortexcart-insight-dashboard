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

        // Save the main user token to the 'users' table for future API calls
        await db.query(`UPDATE users SET access_token_encrypted = ? WHERE email = ?`, [encrypt(userAccessToken), userEmail]);

        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts`;
        const pagesParams = new URLSearchParams({
            fields: 'id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}',
            access_token: userAccessToken,
        });
        const pagesRes = await axios.get(`${pagesUrl}?${pagesParams.toString()}`);
        
        if (!pagesRes.data.data || pagesRes.data.data.length === 0) {
            return redirect(`${redirectUrl}?success=facebook_connected_no_pages`);
        }

        for (const page of pagesRes.data.data) {
            await db.query(
                `INSERT INTO facebook_pages (user_email, page_id, page_name, page_access_token_encrypted, picture_url) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE page_name = VALUES(page_name), page_access_token_encrypted = VALUES(page_access_token_encrypted), picture_url = VALUES(picture_url)`,
                [userEmail, page.id, page.name, encrypt(page.access_token), page.picture?.data?.url || null]
            );

            if (page.instagram_business_account) {
                const ig = page.instagram_business_account;
                await db.query(
                    `INSERT INTO instagram_accounts (user_email, page_id, instagram_id, username, profile_picture_url) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username), profile_picture_url = VALUES(profile_picture_url)`,
                    [userEmail, page.id, ig.id, ig.username, ig.profile_picture_url || null]
                );
            }
        }
    } catch (error) {
        console.error('[FACEBOOK CALLBACK] CRITICAL ERROR:', error.response?.data || error.message);
        return redirect(`${redirectUrl}?error=facebook_failed`);
    }

    return redirect(`${redirectUrl}?success=facebook_connected`);
}