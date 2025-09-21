import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return redirect('/login');
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const userEmail = session.user.email;
    const redirectUrl = '/settings/social-connections';

    if (!code) {
        console.error("Facebook callback error: No code provided.");
        return redirect(`${redirectUrl}?error=facebook_denied`);
    }

    try {
        // Step 1: Exchange code for a user access token
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.NEXTAUTH_URL}/connect/callback/facebook&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`;
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("Facebook Token Error:", tokenData.error);
            throw new Error(tokenData.error.message);
        }
        const userAccessToken = tokenData.access_token;
        
        // Step 2: Fetch pages the user manages, requesting specific fields
       // const pagesUrl = `https://graph.facebook.com/me/accounts?fields=id,name,access_token,picture{url}&access_token=${userAccessToken}`;
       const pagesUrl = `https://graph.facebook.com/me/accounts?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&access_token=${userAccessToken}`;
       const pagesResponse = await fetch(pagesUrl);
       const pagesData = await pagesResponse.json();

        if (pagesData.error) {
            console.error("Facebook Pages Error:", pagesData.error);
            throw new Error(pagesData.error.message);
        }

        console.log(`Found ${pagesData.data.length} pages for user ${userEmail}`);

        // Step 3: Save the main connection status
        const encryptedUserToken = encrypt(userAccessToken);
        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted) 
             VALUES (?, 'facebook', ?)
             ON DUPLICATE KEY UPDATE access_token_encrypted = VALUES(access_token_encrypted)`,
            [userEmail, encryptedUserToken]
        );

        // Step 4: Insert or update each page into your database
        if (pagesData.data && pagesData.data.length > 0) {
            for (const page of pagesData.data) {
                const encryptedToken = encrypt(page.access_token);
                const pictureUrl = page.picture?.data?.url || null;

                await db.query(
                    `INSERT INTO facebook_pages (user_email, page_id, page_name, access_token_encrypted, picture_url)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        page_name = VALUES(page_name),
                        access_token_encrypted = VALUES(access_token_encrypted),
                        picture_url = VALUES(picture_url)`,
                    [userEmail, page.id, page.name, encryptedToken, pictureUrl]
                );
                if (page.instagram_business_account) {
                    const ig = page.instagram_business_account;
                    await db.query(
                        `INSERT INTO instagram_accounts (user_email, page_id, instagram_id, username, profile_picture_url)
                         VALUES (?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                            username = VALUES(username),
                            profile_picture_url = VALUES(profile_picture_url)`,
                        [userEmail, page.id, ig.id, ig.username, ig.profile_picture_url]
                    );
                }
            }
        
        } else {
             console.log(`User ${userEmail} connected, but no manageable pages were found or returned by the API.`);
        }
        
    } catch (error) {
        console.error('CRITICAL ERROR during Facebook OAuth callback:', error);
        return redirect(`${redirectUrl}?error=facebook_failed`);
    }

    return redirect(`${redirectUrl}?success=facebook_connected`);
}