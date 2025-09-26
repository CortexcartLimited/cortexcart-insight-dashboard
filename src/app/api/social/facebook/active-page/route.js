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
    if (!pageId) {
        return NextResponse.json({ error: 'Page ID is required.' }, { status: 400 });
    }

    const userEmail = session.user.email;

    try {
        // Step 1: Set all of the user's Facebook pages to inactive first.
        // This ensures only one can be active at a time.
        await db.query(
            `UPDATE social_connect SET active_facebook_page_id = NULL WHERE user_email = ? AND platform = 'facebook'`,
            [userEmail]
        );

        // Step 2: Set the selected page as active on the correct table.
        const [updateResult] = await db.query(
            `UPDATE social_connect SET active_facebook_page_id = ? WHERE user_email = ? AND page_id = ?`,
            [pageId, userEmail, pageId]
        );

        if (updateResult.affectedRows === 0) {
            return NextResponse.json({ error: 'Could not find the specified page to activate. Please try reconnecting your account.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Active page updated successfully.' });

    } catch (error) {
        console.error("Error setting active Facebook page:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}