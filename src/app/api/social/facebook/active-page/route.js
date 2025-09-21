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
        const { pageId } = await req.json();
        if (!pageId) {
            return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
        }

        const userEmail = session.user.email;

        // Start a transaction to ensure both updates succeed or fail together
        await db.query('START TRANSACTION');

        // Step 1: Set all of the user's pages to inactive
        await db.query(
            'UPDATE facebook_pages SET is_active = FALSE WHERE user_email = ?',
            [userEmail]
        );

        // Step 2: Set the selected page to active
        const [result] = await db.query(
            'UPDATE facebook_pages SET is_active = TRUE WHERE user_email = ? AND page_id = ?',
            [userEmail, pageId]
        );

        await db.query('COMMIT');

        if (result.affectedRows === 0) {
            throw new Error('Page not found or user not authorized to update this page.');
        }

        return NextResponse.json({ success: true, message: 'Active page updated successfully.' });
    } catch (error) {
        await db.query('ROLLBACK'); // Rollback the transaction on error
        console.error('Error setting active Facebook page:', error);
        return NextResponse.json({ error: 'Failed to set active page.' }, { status: 500 });
    }
}