import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export default async function FacebookCallback(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return redirect('/login');
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const userEmail = session.user.email;
    const redirectUrl = '/settings/social-connections';

    if (!code) {
        return redirect(`${redirectUrl}?error=facebook_denied`);
    }

    try {
        // Step 1: Exchange code for a long-lived user access token
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.NEXTAUTH_URL}/connect/callback/facebook&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`;
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            throw new Error(tokenData.error.message);
        }
        const userAccessToken = tokenData.access_token;
        
        // Step 2: Fetch pages, now including the 'picture' field
        const pagesUrl = `https://graph.facebook.com/me/accounts?fields=id,name,access_token,picture&access_token=${userAccessToken}`;
        const pagesResponse = await fetch(pagesUrl);
        const pagesData = await pagesResponse.json();

        if (pagesData.error) {
            throw new Error(pagesData.error.message);
        }

        // Step 3: Insert or update each page into your table
        for (const page of pagesData.data) {
            const encryptedToken = encrypt(page.access_token);
            const pictureUrl = page.picture?.data?.url || null; // Safely get the picture URL

            await db.query(
                `INSERT INTO facebook_pages (user_email, page_id, page_name, access_token_encrypted, picture_url)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    page_name = VALUES(page_name),
                    access_token_encrypted = VALUES(access_token_encrypted),
                    picture_url = VALUES(picture_url)`,
                [userEmail, page.id, page.name, encryptedToken, pictureUrl]
            );
        }
        
    } catch (error) {
        console.error('Error during Facebook OAuth callback:', error);
        return redirect(`${redirectUrl}?error=facebook_failed`);
    }

    return redirect(`${redirectUrl}?success=facebook_connected`);
}