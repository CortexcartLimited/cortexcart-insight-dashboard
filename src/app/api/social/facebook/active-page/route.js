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
        const [connections] = await db.query(
            'SELECT active_facebook_page_id FROM facebook_pages_connected WHERE user_email = ?',
            [session.user.email]
        );

        // Return the active page ID, or null if none is set
        const activePageId = connections[0]?.active_facebook_page_id || null;
        return NextResponse.json({ active_facebook_page_id: activePageId });

    } catch (error) {
        console.error('Error fetching active Facebook page:', error);
        return NextResponse.json({ error: 'Failed to fetch active page.' }, { status: 500 });
    }
}