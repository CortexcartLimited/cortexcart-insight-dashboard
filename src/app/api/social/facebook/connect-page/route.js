import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId, pageName } = await request.json();
    if (!pageId || !pageName) {
        return NextResponse.json({ error: 'Page ID and Page Name are required' }, { status: 400 });
    }

    try {
        const [userConnectionRows] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'facebook']
        );

        if (userConnectionRows.length === 0 || !userConnectionRows[0].access_token_encrypted) {
            return NextResponse.json({ error: 'Main Facebook connection not found.' }, { status: 404 });
        }
        
        const userAccessToken = userConnectionRows[0].access_token_encrypted;

        await db.query(
            "DELETE FROM social_connect WHERE user_email = ? AND platform = 'facebook'",
            [session.user.email]
        );

        // --- FIX: The column 'account_id' has been corrected to 'account_identifier' ---
        await db.query(
            `INSERT INTO social_connect (user_email, platform, access_token_encrypted, active_facebook_page_id, account_name) 
             VALUES (?, 'facebook', ?, ?, ?)`,
            [session.user.email, userAccessToken, pageId, pageName]
        );

        return NextResponse.json({ message: 'Page connected successfully.' });
    } catch (error) {
        console.error('Error connecting Facebook page:', error);
        return NextResponse.json({ error: 'Failed to connect page.' }, { status: 500 });
    }
}