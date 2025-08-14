import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

// This helper can be reused or moved to a shared lib file
async function getShopifyCredentials(userEmail) {
    const [rows] = await db.query(
        'SELECT access_token_encrypted, shopify_shop_name FROM social_connect WHERE user_email = ? AND platform = ?',
        [userEmail, 'shopify']
    );
    if (rows.length === 0) return null;
    return {
        accessToken: decrypt(rows[0].access_token_encrypted),
        shopName: rows[0].shopify_shop_name,
    };
}

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new Response('Not authenticated', { status: 401 });
    }

    const shopifyCreds = await getShopifyCredentials(session.user.email);
    if (!shopifyCreds) {
        return new Response('Shopify connection not found.', { status: 404 });
    }

    // This allows us to handle pagination later
    const { searchParams } = new URL(request.url);
    const pageInfo = searchParams.get('page_info');
    const limit = 10; // Number of products per page

    const { accessToken, shopName } = shopifyCreds;
    const shopifyApiUrl = `https:///${shopName}/admin/api/2024-04`;

    try {
        const shopifyApi = axios.create({
            baseURL: shopifyApiUrl,
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        const response = await shopifyApi.get(`/products.json?limit=${limit}${pageInfo ? `&page_info=${pageInfo}` : ''}`);
        
        // Shopify provides pagination links in the response headers
        const linkHeader = response.headers.link;
        let nextPageInfo = null;
        if (linkHeader) {
            const links = linkHeader.split(', ');
            const nextLink = links.find(link => link.includes('rel="next"'));
            if (nextLink) {
                const match = nextLink.match(/page_info=([^>]+)/);
                nextPageInfo = match ? match[1] : null;
            }
        }

        return NextResponse.json({
            products: response.data.products,
            nextPageInfo: nextPageInfo,
        });

    } catch (error) {
        console.error('Failed to fetch Shopify products:', error.response?.data || error.message);
        return new Response('An error occurred while fetching products from Shopify.', { status: 500 });
    }
}