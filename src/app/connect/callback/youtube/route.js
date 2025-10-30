import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserSubscription } from "@/lib/userSubscription"; //
import { getPlanDetails } from "@/lib/plans"; //

export async function GET(req) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    const redirectUrl = new URL('/settings/platforms/', appUrl);
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.searchParams.set('message', 'invalid_callback_code');
        return NextResponse.redirect(redirectUrl);
    }
    
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            redirectUrl.searchParams.set('connect_status', 'error');
            redirectUrl.searchParams.set('message', 'authentication_required');
            return NextResponse.redirect(redirectUrl);
        }

        const params = new URLSearchParams();
        params.append('client_id', process.env.YOUTUBE_CLIENT_ID);
        params.append('client_secret', process.env.YOUTUBE_CLIENT_SECRET);
        params.append('redirect_uri', `${appUrl}/connect/callback/youtube`);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', params);
        const { access_token, refresh_token } = tokenResponse.data;

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

        const query = `
            INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, is_active)
            VALUES (?, ?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE
            access_token_encrypted = VALUES(access_token_encrypted),
            refresh_token_encrypted = VALUES(refresh_token_encrypted);
        `;
        
        await db.query(query, [ 
            session.user.email, 
            'youtube', 
            encrypt(access_token), 
            refresh_token ? encrypt(refresh_token) : null 
        ]);

        redirectUrl.searchParams.set('connect_status', 'success');
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("YouTube connection error:", error.response?.data || error.message);
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.search_params.set('message', 'connection_failed');
        return NextResponse.redirect(redirectUrl);
    }
}