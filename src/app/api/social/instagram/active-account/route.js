import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { instagramId } = await req.json();
        if (!instagramId) {
            return NextResponse.json({ error: 'Instagram ID is required' }, { status: 400 });
        }

        const userEmail = session.user.email;

        // Start a transaction to ensure both updates succeed or fail together
        await db.query('START TRANSACTION');

        // Step 1: Set all of the user's Instagram accounts to inactive
        await db.query(
            'UPDATE instagram_accounts SET is_active = FALSE WHERE user_email = ?',
            [userEmail]
        );

        // Step 2: Set the selected Instagram account to active
        const [result] = await db.query(
            'UPDATE instagram_accounts SET is_active = TRUE WHERE user_email = ? AND instagram_id = ?',
            [userEmail, instagramId]
        );

        await db.query('COMMIT');

        if (result.affectedRows === 0) {
            throw new Error('Instagram account not found or user not authorized.');
        }

        return NextResponse.json({ success: true, message: 'Active Instagram account updated.' });

    } catch (error) {
        await db.query('ROLLBACK'); // Rollback the transaction on error
        console.error('Error setting active Instagram account:', error);
        return NextResponse.json({ error: 'Failed to set active account.' }, { status: 500 });
    }
}