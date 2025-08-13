import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response('Not authenticated', { status: 401 });
    }

    const formData = await request.formData();
    const shop = formData.get('shop'); // e.g., "your-store-name"

    if (!shop) {
        return new Response('Shop name is required', { status: 400 });
    }

    const scopes = 'read_products,read_orders,read_analytics';
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/shopify/callback`;
    
    // This is the URL the user will be sent to for authorization
    const authUrl = `https:///${shop}.myshopify.com/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}`;

    // Redirect the user to the Shopify authorization screen
    return NextResponse.redirect(authUrl);
}