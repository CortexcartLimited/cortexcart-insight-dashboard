import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT access_token_encrypted, shopify_shop_name FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'shopify']
        );
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Shopify not connected' }, { status: 404 });
        }
        
        const accessToken = decrypt(rows[0].access_token_encrypted);
        const shopName = rows[0].shopify_shop_name;

        const shopifyResponse = await axios.get(`https://${shopName}/admin/api/2024-07/shop.json`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });

        return NextResponse.json(shopifyResponse.data.shop);

    } catch (error) {
        console.error("Failed to fetch Shopify store info:", error.response?.data);
        return NextResponse.json({ message: 'Could not fetch store info' }, { status: 500 });
    }
}