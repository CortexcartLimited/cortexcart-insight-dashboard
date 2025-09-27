// src/app/api/social/facebook/active-page/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { pageId } = await req.json();
    const userEmail = session.user.email;

    try {
        // First, clear any existing active page setting for this user.
        await db.query(
            `UPDATE social_connect SET active_facebook_page_id = NULL WHERE user_email = ? AND platform = 'facebook'`,
            [userEmail]
        );

        // Then, set the new active page on the correct row.
        const [updateResult] = await db.query(
            `UPDATE social_connect SET active_facebook_page_id = ? WHERE user_email = ? AND page_id = ?`,
            [pageId, userEmail, pageId]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error('Could not find the specified page to activate in the database.');
        }

        return NextResponse.json({ success: true, message: 'Active page updated successfully.' });
    } catch (error) {
        console.error("Error setting active Facebook page:", error);
        return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
    }
}