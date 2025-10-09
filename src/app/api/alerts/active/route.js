import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET handler to fetch active alert banners for the user dashboard
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        // Even though it's for display, ensure user is logged in.
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [alerts] = await db.query(
            "SELECT id, title, message, type FROM alert_banners WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 2"
        );
        return NextResponse.json(alerts, { status: 200 });
    } catch (error) {
        console.error('Error fetching active alerts:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
