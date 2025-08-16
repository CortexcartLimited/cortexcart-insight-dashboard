// src/app/api/quickbooks/status/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ isConnected: false, message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [connections] = await db.query(
            'SELECT 1 FROM social_connect WHERE user_email = ? AND platform = ? LIMIT 1',
            [session.user.email, 'quickbooks']
        );

        const isConnected = connections.length > 0;
        
        return NextResponse.json({ isConnected });

    } catch (error) {
        console.error('Error checking QuickBooks connection status:', error);
        return NextResponse.json({ isConnected: false, message: 'Internal Server Error' }, { status: 500 });
    }
}