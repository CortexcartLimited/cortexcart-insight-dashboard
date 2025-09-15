import { NextResponse } from 'next/server';
import { Shopify, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// This securely initializes the Shopify client with your server-side environment variables
const shopify = Shopify.Context.initialize({
    API_KEY: process.env.SHOPIFY_API_KEY, // Use your server-side variable
    API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
    SCOPES: process.env.SHOPIFY_SCOPES.split(','),
    HOST_NAME: process.env.HOST.replace(/^https?:\/\//, ""), // Safely removes http/https
    API_VERSION: LATEST_API_VERSION,
    IS_EMBEDDED_APP: false,
    SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    // This removes any accidental spaces from the shop name
    const shop = searchParams.get('shop')?.trim();

    if (!shop) {
        return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    try {
        // This is the official library method to begin the OAuth process.
        // It correctly builds the URL and handles the security state token.
        const authUrl = await shopify.Auth.beginAuth({
            shop: `${shop}.myshopify.com`, // Ensures the .myshopify.com is present
            callbackPath: '/api/connect/shopify/callback',
            isOnline: false,
            req: request,
            res: new NextResponse(),
        });

        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error('Error beginning Shopify auth:', error);
        return NextResponse.json({ error: 'Failed to initiate Shopify authentication.' }, { status: 500 });
    }
}