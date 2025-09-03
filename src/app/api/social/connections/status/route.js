import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

// This function fetches the connection statuses and is correct.
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT platform FROM social_connect WHERE user_email = ?',
            [session.user.email]
        );

        const requiredPlatforms = ['facebook', 'x', 'youtube', 'pinterest', 'shopify', 'mailchimp'];
        const connections = {};
        
        const connectedPlatforms = rows.map(r => r.platform);

        requiredPlatforms.forEach(platform => {
            connections[platform] = connectedPlatforms.includes(platform);
        });
        
        return NextResponse.json(connections);

    } catch (error) {
        console.error('Error fetching connection statuses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ FIX: This is the new function that handles the "Disconnect" button.
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { platform } = await req.json();

        if (!platform) {
            return NextResponse.json({ message: 'Platform is required.' }, { status: 400 });
        }

        // This query will delete the connection from the database.
        const query = 'DELETE FROM social_connect WHERE user_email = ? AND platform = ?';
        const [result] = await db.query(query, [session.user.email, platform]);

        if (result.affectedRows > 0) {
            return NextResponse.json({ message: 'Disconnected successfully.' });
        } else {
            return NextResponse.json({ message: 'No active connection found for this platform.' }, { status: 404 });
        }

    } catch (error) {
        console.error('Error disconnecting account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}