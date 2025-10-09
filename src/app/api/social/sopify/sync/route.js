// src/app/api/social/shopify/sync/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;
    let connection;

    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Get the user's stored Shopify credentials
        const [stores] = await connection.query(
            'SELECT store_url, access_token_encrypted FROM shopify_stores WHERE user_email = ?',
            [userEmail]
        );

        if (stores.length === 0) {
            throw new Error('No Shopify store is connected for this user.');
        }

        const { store_url, access_token_encrypted } = stores[0];
        const accessToken = decrypt(access_token_encrypted);
        
        const shopifyApiUrl = `https://${store_url}/admin/api/2023-10`;

        // 2. Fetch recent orders from Shopify
        const ordersResponse = await axios.get(`${shopifyApiUrl}/orders.json?status=any&limit=50`, {
            headers: { 'X-Shopify-Access-Token': accessToken }
        });
        const orders = ordersResponse.data.orders;

        if (orders) {
            for (const order of orders) {
                await connection.query(
                    `INSERT INTO shopify_orders (user_email, order_id, order_number, total_price, customer_name, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     total_price = VALUES(total_price), customer_name = VALUES(customer_name);`,
                    [
                        userEmail,
                        order.id,
                        order.name,
                        order.total_price,
                        `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
                        new Date(order.created_at)
                    ]
                );
            }
        }
        
        // 3. Calculate and store overall analytics
        const [analyticsResult] = await connection.query(
            `SELECT COUNT(*) as total_orders, SUM(total_price) as total_sales
             FROM shopify_orders
             WHERE user_email = ?`,
            [userEmail]
        );

        const { total_orders, total_sales } = analyticsResult[0];
        const average_order_value = total_orders > 0 ? total_sales / total_orders : 0;

        await connection.query(
            `INSERT INTO shopify_analytics (user_email, store_url, total_sales, total_orders, average_order_value)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             total_sales = VALUES(total_sales), total_orders = VALUES(total_orders), average_order_value = VALUES(average_order_value);`,
            [userEmail, store_url, total_sales, total_orders, average_order_value]
        );

        await connection.commit();

        return NextResponse.json({ message: 'Shopify data synced successfully.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error syncing Shopify data:", error.response ? error.response.data : error.message);
        const errorMessage = error.response?.data?.errors || error.message || 'An unknown error occurred.';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}