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
        const [pages] = await db.query(
            'SELECT page_id, page_name, picture_url, is_active FROM facebook_pages WHERE user_email = ?',
            [session.user.email]
        );

        return NextResponse.json(pages);
    } catch (error) {
        console.error('Error fetching Facebook pages:', error);
        return NextResponse.json({ error: 'Failed to fetch Facebook pages' }, { status: 500 });
    }
}