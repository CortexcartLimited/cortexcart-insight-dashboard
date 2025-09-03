import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Corrected SQL Query
        const [rows] = await db.query(
            'SELECT active_facebook_page_id FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'facebook']
        );

        if (rows.length === 0) {
            return NextResponse.json({ active_facebook_page_id: null });
        }

        return NextResponse.json({ active_facebook_page_id: rows[0].active_facebook_page_id });

    } catch (error) {
        console.error('Error fetching active Facebook page:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}