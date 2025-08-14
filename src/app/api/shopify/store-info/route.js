import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

async function getShopifyCredentials(userEmail) {
    const [rows] = await db.query(
        'SELECT access_token_encrypted, shopify_shop_name FROM social_connect WHERE user_email = ? AND platform = ?',
        [userEmail, 'shopify']
    );

    if (rows.length === 0) {
        return null;
    }

    const credentials = rows[0];
    return {
        accessToken: decrypt(credentials.access_token_encrypted),
        shopName: credentials.shopify_shop_name,
    };
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new Response('Not authenticated', { status: 401 });
    }

    const shopifyCreds = await getShopifyCredentials(session.user.email);

    if (!shopifyCreds) {
        return new Response('Shopify connection not found.', { status: 404 });
    }

    const { accessToken, shopName } = shopifyCreds;
    const shopifyApiUrl = `https://${shopName}/admin/api/2023-10`;

    try {
        const shopifyApi = axios.create({
            baseURL: shopifyApiUrl,
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        // Use Promise.allSettled to handle individual API call failures
        const results = await Promise.allSettled([
            shopifyApi.get('/shop.json'),
            shopifyApi.get('/products/count.json'),
        ]);

        // Safely extract data from the results
        const shopData = results[0].status === 'fulfilled' ? results[0].value.data.shop : null;
        const productsCount = results[1].status === 'fulfilled' ? results[1].value.data.count : null;
        
        if (!shopData) {
            // If we can't even get the basic shop data, there's a fundamental issue.
            console.error('Failed to fetch essential Shopify shop data:', results[0].reason?.response?.data);
            return new Response('Could not connect to Shopify. Please try reconnecting.', { status: 500 });
        }

        const stats = {
            shop: shopData,
            productsCount: productsCount,
        };

        return NextResponse.json(stats);

    } catch (error) {
        // This will catch broader errors, like issues with credentials or db connection
        console.error('A general error occurred while fetching Shopify data:', error.message);
        return new Response('An unexpected error occurred.', { status: 500 });
    }
}