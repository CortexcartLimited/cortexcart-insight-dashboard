import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new Response('Not authenticated', { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        // This query fetches all connections for the user
        const [rows] = await db.query(
            'SELECT platform, access_token_encrypted, shopify_shop_name FROM social_connect WHERE user_email = ?',
            [userEmail]
        );

        const connections = {};

        // Loop through all database rows
        for (const row of rows) {
            let isConnected = false;
            try {
                // Check if the token is valid by trying to decrypt it
                const decryptedToken = decrypt(row.access_token_encrypted);
                isConnected = !!decryptedToken; 
            } catch (e) {
                // If decryption fails, the token is invalid or corrupt
                isConnected = false;
            }
            
            // Build the response object in the correct format
            connections[row.platform] = {
                isConnected: isConnected,
                // Specifically include the shop name for Shopify
                shopName: row.shopify_shop_name || null, 
            };
        }

        return NextResponse.json(connections);

    } catch (error) {
        console.error('Error fetching connection statuses:', error);
        return new Response('Internal Server Error while fetching status.', { status: 500 });
    }
}


export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new Response('Not authenticated', { status: 401 });
    }

    const { platform } = await request.json();

    if (!platform) {
        return new Response('Platform name is required.', { status: 400 });
    }

    try {
        await db.query(
            'DELETE FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, platform]
        );
        return NextResponse.json({ message: `${platform} disconnected successfully.` });
    } catch (error) {
        console.error(`Error disconnecting ${platform}:`, error);
        return new Response(`Internal Server Error while disconnecting ${platform}.`, { status: 500 });
    }
}