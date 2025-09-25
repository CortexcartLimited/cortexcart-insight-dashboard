import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return redirect('/login');

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const userEmail = session.user.email;
    const redirectUrl = '/settings/social-connections';

    if (!code) return redirect(`${redirectUrl}?error=facebook_denied`);

    try {
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.NEXTAUTH_URL}/connect/callback/facebook&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`;
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();
        if (tokenData.error) throw new Error(`Token Error: ${tokenData.error.message}`);
        
        const userAccessToken = tokenData.access_token;

        const pagesUrl = `https://graph.facebook.com/me/accounts?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&access_token=${userAccessToken}`;
        const pagesResponse = await fetch(pagesUrl);
        const pagesData = await pagesResponse.json();
        if (pagesData.error) throw new Error(`Pages Error: ${pagesData.error.message}`);

        // --- FIX 1: Corrected SQL Syntax ---
        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted) VALUES (?, 'facebook', ?) ON DUPLICATE KEY UPDATE access_token_encrypted = VALUES(access_token_encrypted)`,
            [userEmail, encrypt(userAccessToken)]
        );

        if (pagesData.data && pagesData.data.length > 0) {
            for (const page of pagesData.data) {
                // --- FIX 2: Corrected SQL Syntax ---
                await db.query(
                    `INSERT INTO facebook_pages (user_email, page_id, page_name, access_token_encrypted, picture_url) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE page_name = VALUES(page_name), access_token_encrypted = VALUES(access_token_encrypted), picture_url = VALUES(picture_url)`,
                    [userEmail, page.id, page.name, encrypt(page.access_token), page.picture?.data?.url || null]
                );

                if (page.instagram_business_account) {
                    const ig = page.instagram_business_account;
                    // --- FIX 3: Corrected SQL Syntax ---
                    await db.query(
        `INSERT INTO instagram_accounts (user_email, page_id, instagram_user_id, username, profile_picture_url)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            profile_picture_url = VALUES(profile_picture_url)`,
        [userEmail, page.id, ig.id, ig.username, ig.profile_picture_url]
    );
                }
            }
        }
    } catch (error) {
        console.error('[FACEBOOK CALLBACK] CRITICAL ERROR:', error);
        return redirect(`${redirectUrl}?error=facebook_failed`);
    }

    return redirect(`${redirectUrl}?success=facebook_connected`);
}