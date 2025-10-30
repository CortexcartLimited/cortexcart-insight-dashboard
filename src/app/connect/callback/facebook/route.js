// src/app/connect/callback/facebook/route.js

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';
import { getUserSubscription } from "@/lib/userSubscription"; //
import { getPlanDetails } from "@/lib/plans"; //

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
        if (!userAccessToken) throw new Error('Failed to retrieve user access token from Facebook.');

        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts`;
        const pagesParams = new URLSearchParams({
            fields: 'id,name,access_token,instagram_business_account{id,username}',
            access_token: userAccessToken,
        });
        const pagesRes = await axios.get(`${pagesUrl}?${pagesParams.toString()}`);
        const pagesData = pagesRes.data.data;

        if (!pagesData || pagesData.length === 0) {
            throw new Error('No Facebook pages were found for this account. Please ensure the connected account manages at least one page.');
        }

        // Save the main user token to a single, identifiable row.
        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted,is_active) VALUES (?, 'facebook', ?, TRUE) ON DUPLICATE KEY UPDATE access_token_encrypted = VALUES(access_token_encrypted)`,
            [userEmail, encrypt(userAccessToken)]
        );

        // For each page, save its specific credentials into the same table.
        for (const page of pagesData) {
            await db.query(
                `INSERT INTO social_connect (user_email, platform, page_id, page_access_token_encrypted) VALUES (?, 'facebook-page', ?, ?) ON DUPLICATE KEY UPDATE page_access_token_encrypted = VALUES(page_access_token_encrypted)`,
                [userEmail, page.id, encrypt(page.access_token)]
            );

            if (page.instagram_business_account) {
                const ig = page.instagram_business_account;

                // --- START PLAN LIMIT CHECK ---
try { // Wrap check in try/catch for DB errors

    // 1. Fetch User's Plan Details
    const subscription = await getUserSubscription(userEmail);
    const userPlan = getPlanDetails(subscription?.stripePriceId); // Gets plan or default
    const maxConnections = userPlan?.limits?.maxSocialConnections ?? 0;

    // 2. Fetch Current Active Connections Count (Using corrected query)
    const [countRows] = await db.query(
        `SELECT COUNT(*) as count
         FROM social_connect
         WHERE user_email = ?
           AND platform IN ('facebook', 'pinterest', 'instagram', 'x', 'google', 'youtube')
           AND is_active = TRUE`, // Adjust 'is_active' if needed
        [userEmail]
    );
    const currentConnections = countRows[0]?.count ?? 0;

    // 3. Check if this specific platform connection already exists and is active
    const [existingConnection] = await db.query(
         `SELECT 1 FROM social_connect WHERE user_email = ? AND platform = ? AND is_active = TRUE LIMIT 1`,
         [userEmail, 'x'] // <-- IMPORTANT: Change 'x' for other platform callbacks
    );

    // 4. Enforce Limit: Block if it's a NEW connection AND limit is reached
    if (existingConnection.length === 0 && currentConnections >= maxConnections) {
        console.warn(`LIMIT REACHED: User ${userEmail} tried to connect Twitter. Limit: ${maxConnections}, Current: ${currentConnections}.`);
        // Redirect back to settings page with an error message
        return NextResponse.redirect(new URL('/settings/social-connections?error=limit_reached', req.nextUrl.origin));
    }

     console.log(`Limit check passed for ${userEmail} connecting Twitter. Limit: ${maxConnections}, Current: ${currentConnections}, Exists: ${existingConnection.length > 0}`);

} catch (checkError) {
     console.error("Error during plan limit check:", checkError);
     // Redirect with a generic error if the check fails
     return NextResponse.redirect(new URL('/settings/social-connections?error=check_failed', req.nextUrl.origin));
}
// --- END PLAN LIMIT CHECK ---

// --- CONTINUE with existing logic below ---
// (e.g., exchange Twitter codes for tokens, save tokens to DB)

                // --- START OF FIX ---
                // We MUST create the main 'instagram' row in social_connect
                // This is the row the 'active-account' route is looking for.
                await db.query(
                    `INSERT INTO social_connect (user_email, platform) 
                     VALUES (?, 'instagram') 
                     ON DUPLICATE KEY UPDATE platform = 'instagram'`, // This ensures the 'instagram' row exists
                    [userEmail]
                );
                // --- END OF FIX ---

                // This query is correct and saves the specific IG account details
                await db.query(
                    `INSERT INTO instagram_accounts (user_email, page_id, instagram_id, username) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE page_id = VALUES(page_id), username = VALUES(username)`,
                    [userEmail, page.id, ig.id, ig.username]
                );
            }
        }

    } catch (error) {
        console.error('[FACEBOOK CALLBACK] CRITICAL ERROR:', error.response?.data || error.message);
        return redirect(`${redirectUrl}?error=${encodeURIComponent(error.message)}`);
    }

    return redirect(`${redirectUrl}?success=facebook_connected`);
}