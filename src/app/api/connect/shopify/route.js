import { NextResponse } from 'next/server';
import { shopifyApi, ApiVersion, LATEST_API_VERSION } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-07'; // Or your target version
import '@shopify/shopify-api/adapters/node';

// This is the new V10 syntax for initializing the Shopify client
const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES.split(','),
    hostName: process.env.HOST.replace(/^https?:\/\//, ""),
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: false,
    restResources, // Include the REST resources
    sessionStorage: new Shopify.Session.MemorySessionStorage(), // Temporary storage
});

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop')?.trim();

    if (!shop) {
        return NextResponse.json({ error: 'Missing or invalid shop parameter' }, { status: 400 });
    }

    try {
        // The V10 method for beginning the OAuth process
        const authUrl = await shopify.auth.begin({
            shop: `${shop}.myshopify.com`,
            callbackPath: '/api/connect/shopify/callback',
            isOnline: false, // Use false for offline access tokens
            rawRequest: request,
            rawResponse: new NextResponse(),
        });
        
        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error('Error beginning Shopify auth:', error);
        return NextResponse.json({ error: `Failed to initiate Shopify authentication: ${error.message}` }, { status: 500 });
    }
}