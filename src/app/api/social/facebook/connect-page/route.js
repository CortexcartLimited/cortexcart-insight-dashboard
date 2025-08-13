import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { pageId } = await request.json();
    if (!pageId) {
        return NextResponse.json({ error: 'Page ID is required.' }, { status: 400 });
    }

    try {
        // This query now saves the choice to your new table
        const query = `
            INSERT INTO facebook_pages_connected (user_email, active_facebook_page_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE active_facebook_page_id = VALUES(active_facebook_page_id);
        `;
        await db.query(query, [session.user.email, pageId]);
        
        return NextResponse.json({ success: true, message: 'Page connected successfully!' });
    } catch (error) {
        console.error('Error connecting Facebook page:', error);
        return NextResponse.json({ error: 'Failed to connect page.' }, { status: 500 });
    }
}