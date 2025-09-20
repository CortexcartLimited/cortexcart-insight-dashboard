import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT platform FROM social_connect WHERE user_email = ?',
            [session.user.email]
        );

        // Create an object to easily check connection status, e.g., { facebook: true, x: true }
        const connections = rows.reduce((acc, row) => {
            acc[row.platform] = true;
            return acc;
        }, {});

        return NextResponse.json(connections);
    } catch (error) {
        console.error('Error fetching social connection statuses:', error);
        return NextResponse.json({ error: 'Failed to fetch statuses' }, { status: 500 });
    }
}