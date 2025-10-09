import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, accountName, pageId } = await request.json();
    if (!accountId || !accountName || !pageId) {
        return NextResponse.json({ error: 'Account ID, Name, and associated Page ID are required' }, { status: 400 });
    }

    try {
        // Use a robust "upsert" (DELETE then INSERT) to set the active Instagram account.
        
        // 1. Delete any existing active account record for this user.
        await db.query(
            "DELETE FROM instagram_accounts WHERE user_email = ?",
            [session.user.email]
        );

        // 2. Insert the new active account record with its linking page_id.
        await db.query(
            `INSERT INTO instagram_accounts (user_email, instagram_id, account_name, page_id) VALUES (?, ?, ?, ?)`,
            [session.user.email, accountId, accountName, pageId]
        );

        return NextResponse.json({ message: 'Instagram account connected successfully.' });
    } catch (error) {
        console.error('Error connecting Instagram account:', error);
        return NextResponse.json({ error: 'Failed to connect Instagram account.' }, { status: 500 });
    }
}