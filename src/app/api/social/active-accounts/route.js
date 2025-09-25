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
        const userEmail = session.user.email;

        const [activeFacebookPage] = await db.query(
            'SELECT page_id, page_name, access_token_encrypted FROM facebook_pages WHERE user_email = ? AND is_active = TRUE',
            [userEmail]
        );

        const [activeInstagramAccount] = await db.query(
            'SELECT instagram_id, username, page_id FROM instagram_accounts WHERE user_email = ? AND is_active = TRUE',
            [userEmail]
        );

        return NextResponse.json({
            facebook: activeFacebookPage[0] || null,
            instagram: activeInstagramAccount[0] || null,
        });

    } catch (error) {
        console.error('Error fetching active social accounts:', error);
        return NextResponse.json({ error: 'Failed to fetch active accounts.' }, { status: 500 });
    }
}