import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';
import { cookies } from 'next/headers'; // Import cookies

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.redirect(new URL('/login?error=unauthenticated', request.url));
    }

    // FIX 1: Use the correct NEXTAUTH_URL for all redirects
    const settingsUrl = new URL('/settings/platforms/', process.env.NEXTAUTH_URL);

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    
    // FIX 2: Add crucial state validation for security
    const savedState = cookies().get('shopify_oauth_state')?.value;
    if (!state || state !== savedState) {
        settingsUrl.searchParams.set('connect_status', 'error');
        settingsUrl.searchParams.set('message', 'invalid_security_token');
        return NextResponse.redirect(settingsUrl);
    }
    
    // Clean up the state cookie
    cookies().delete('shopify_oauth_state');

    if (!code || !shop) {
        settingsUrl.searchParams.set('connect_status', 'error');
        settingsUrl.searchParams.set('message', 'invalid_callback_parameters');
        return NextResponse.redirect(settingsUrl);
    }

    try {
        const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            code: code,
        });

        const accessToken = tokenResponse.data.access_token;

        const query = `
            INSERT INTO social_connect (user_email, platform, access_token_encrypted, shopify_shop_name, is_active)
            VALUES (?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
            access_token_encrypted = VALUES(access_token_encrypted),
            shopify_shop_name = VALUES(shopify_shop_name),
            is_active = 1;
        `;
        await db.query(query, [session.user.email, 'shopify', encrypt(accessToken), shop]);
        
        settingsUrl.searchParams.set('connect_status', 'success');
        return NextResponse.redirect(settingsUrl);

    } catch (error) {
        console.error("Shopify callback error:", error.response?.data || error.message);
        settingsUrl.searchParams.set('connect_status', 'error');
        settingsUrl.searchParams.set('message', 'shopify_connection_failed');
        return NextResponse.redirect(settingsUrl);
    }
}