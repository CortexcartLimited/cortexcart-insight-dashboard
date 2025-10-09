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
        const [connections] = await db.query(
            'SELECT access_token_encrypted, server_prefix FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'mailchimp']
        );

        if (connections.length === 0) {
            return NextResponse.json({ message: 'Mailchimp account not connected.' }, { status: 404 });
        }

        const connection = connections[0];
        const accessToken = decrypt(connection.access_token_encrypted);
        const serverPrefix = connection.server_prefix;

        // Step 1: Find the connected e-commerce store ID
        const storesResponse = await axios.get(`https://${serverPrefix}.api.mailchimp.com/3.0/ecommerce/stores`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (storesResponse.data.stores.length === 0) {
            // If no store is connected to Mailchimp, return a specific response
            return NextResponse.json({ hasEcommerce: false });
        }
        const storeId = storesResponse.data.stores[0].id;

        // Step 2: Fetch overall store report and top 5 products concurrently
        const [reportRes, productsRes] = await Promise.all([
            // Get overall stats (revenue, orders)
            axios.get(`https://${serverPrefix}.api.mailchimp.com/3.0/ecommerce/stores/${storeId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: { fields: 'total_revenue,total_orders,currency_code' }
            }),
            // Get top 5 products by revenue
            axios.get(`https://${serverPrefix}.api.mailchimp.com/3.0/ecommerce/stores/${storeId}/products`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: { count: 5, sort_field: 'total_revenue' }
            })
        ]);

        // Step 3: Combine the data and return it
        const responseData = {
            hasEcommerce: true,
            stats: reportRes.data,
            products: productsRes.data.products,
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Mailchimp E-commerce API Error:', error.response?.data || error.message);
        return NextResponse.json({ message: 'Failed to fetch Mailchimp e-commerce data.' }, { status: 500 });
    }
}