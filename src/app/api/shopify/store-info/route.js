import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

// --- Helper function to get credentials (remains the same) ---
async function getShopifyCredentials(userEmail) {
    const [rows] = await db.query(
        'SELECT access_token_encrypted, shopify_shop_name FROM social_connect WHERE user_email = ? AND platform = ?',
        [userEmail, 'shopify']
    );
    if (rows.length === 0) return null;
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
    const shopifyApiUrl = `https:///${shopName}/admin/api/2024-04`;

    try {
        const shopifyApi = axios.create({
            baseURL: shopifyApiUrl,
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        // --- Fetch all data points in parallel ---
        const results = await Promise.allSettled([
            shopifyApi.get('/shop.json'),
            shopifyApi.get('/products/count.json'),
            shopifyApi.get('/products.json?limit=5&order=created_at+desc'),
            shopifyApi.get('/reports.json') // Fetch all available reports
        ]);

        // --- Safely extract data from settled promises ---
        const shopData = results[0].status === 'fulfilled' ? results[0].value.data.shop : null;
        const productsCount = results[1].status === 'fulfilled' ? results[1].value.data.count : null;
        const recentProducts = results[2].status === 'fulfilled' ? results[2].value.data.products : [];
        const allReports = results[3].status === 'fulfilled' ? results[3].value.data.reports : [];

        if (!shopData) {
            console.error('Failed to fetch essential Shopify shop data:', results[0].reason?.response?.data);
            return new Response('Could not connect to Shopify. Please try reconnecting.', { status: 500 });
        }

        // --- Find the specific reports we need from the full list (this is the new, robust logic) ---
        const salesReport = allReports.find(report => report.name === 'Total sales');
        const sessionsReport = allReports.find(report => report.name === 'Sessions over time');

        const stats = {
            shop: shopData,
            productsCount: productsCount,
            recentProducts: recentProducts,
            // Use the data from the reports we found, with fallbacks
            totalSales: salesReport?.data?.[0]?.total_sales || '0.00',
            totalVisits: sessionsReport?.data?.[0]?.total_sessions || 0,
        };

        return NextResponse.json(stats);

    } catch (error) {
        // The error message from your console will be caught here
        console.error('A general error occurred while fetching Shopify data:', error.message);
        return new Response(`An unexpected error occurred: ${error.message}`, { status: 500 });
    }
}