import { NextResponse } from 'next/server';
import { Shopify, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// Initialize the Shopify API client
const shopify = Shopify.Context.initialize({
    API_KEY: process.env.SHOPIFY_API_KEY,
    API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
    SCOPES: process.env.SHOPIFY_SCOPES.split(','),
    HOST_NAME: process.env.HOST.replace(/^https?:\/\//, ""), // Removes http/https protocol
    API_VERSION: LATEST_API_VERSION,
    IS_EMBEDDED_APP: false,
    SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    // Trim whitespace from the shop parameter to prevent errors
    const shop = searchParams.get('shop')?.trim();

    if (!shop) {
        return NextResponse.json({ error: 'Missing or invalid shop parameter' }, { status: 400 });
    }

    try {
        // This is the old, incorrect method. We remove it.
        // const authRoute = await Shopify.Auth.beginAuth(...);
        
        // This is the new, correct method using the initialized context
        const authUrl = await shopify.Auth.beginAuth({
            shop: shop,
            callbackPath: '/api/connect/shopify/callback',
            isOnline: false, // Use false for offline access tokens
            req: request,
            res: new NextResponse(), // A dummy response object
        });

        // Redirect the user to the Shopify authorization screen
        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error('Error beginning Shopify auth:', error);
        return NextResponse.json({ error: 'Failed to initiate Shopify authentication.' }, { status: 500 });
    }
}