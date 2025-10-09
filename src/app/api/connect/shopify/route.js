import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response('Not authenticated', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
        return new Response('Shop name is required', { status: 400 });
    }
    
    // FIX 1: Use the server-side environment variable for the API Key
    const apiKey = process.env.SHOPIFY_API_KEY;

    // Add a check to make sure the key was actually found on the server
    if (!apiKey) {
        console.error("CRITICAL: SHOPIFY_API_KEY environment variable is not set on the server!");
        return new Response('Server configuration error: Missing API Key.', { status: 500 });
    }

    // FIX 2: Trim whitespace from the shop name to prevent invalid URLs
    const trimmedShop = shop.trim();
    
    const state = randomBytes(16).toString('hex');
    const scopes = 'read_products,read_analytics';
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/shopify/callback`;
    
    const authUrl = `https://${trimmedShop}.myshopify.com/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

    const response = NextResponse.redirect(authUrl);
    
    response.cookies.set('shopify_oauth_state', state, {
        path: '/',
        httpOnly: true,
        maxAge: 600, // 10 minutes
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });

    return response;
}