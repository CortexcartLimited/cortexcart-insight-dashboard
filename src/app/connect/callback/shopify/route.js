import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.redirect(new URL('/login?error=unauthenticated', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    
    const redirectUrl = new URL('/settings/platforms/', request.url);

    if (!code || !shop) {
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.searchParams.set('message', 'invalid_callback');
        return NextResponse.redirect(redirectUrl);
    }

    try {
        // Exchange the temporary code for a permanent access token
        const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            code: code,
        });

        const accessToken = tokenResponse.data.access_token;

        // Save the encrypted token and shop name to the database
        const query = `
            INSERT INTO social_connect (user_email, platform, access_token_encrypted, shopify_shop_name, is_active)
            VALUES (?, ?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE
            access_token_encrypted = VALUES(access_token_encrypted),
            shopify_shop_name = VALUES(shopify_shop_name);
        `;
        await db.query(query, [session.user.email, 'shopify', encrypt(accessToken), shop]);
        
        redirectUrl.searchParams.set('connect_status', 'success');
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("Shopify callback error:", error.response?.data || error.message);
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.searchParams.set('message', 'shopify_connection_failed');
        return NextResponse.redirect(redirectUrl);
    }
}