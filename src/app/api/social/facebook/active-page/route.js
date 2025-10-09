// src/app/api/social/facebook/active-page/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// This GET handler is now corrected to properly fetch the active page ID.
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        const [rows] = await db.query(
            `SELECT active_facebook_page_id FROM social_connect WHERE user_email = ? AND platform = 'facebook'`,
            [userEmail]
        );

        if (rows.length > 0 && rows[0].active_facebook_page_id) {
            // Simply return the pageId. The frontend already has the page name.
            return NextResponse.json({ pageId: rows[0].active_facebook_page_id });
        }
        
        // Return null if no active page is set
        return NextResponse.json(null);

    } catch (error) {
        console.error("Error fetching active Facebook page:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}


export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { pageId } = await req.json();
    const userEmail = session.user.email;

    if (!pageId) {
        return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    try {
        const [updateResult] = await db.query(
            `UPDATE social_connect SET active_facebook_page_id = ? WHERE user_email = ? AND platform = 'facebook'`,
            [pageId, userEmail]
        );

        if (updateResult.affectedRows === 0) {
            // This could happen if the user's main Facebook record doesn't exist yet for some reason.
            // We can create it for them.
             await db.query(
                `INSERT INTO social_connect (user_email, platform, active_facebook_page_id) VALUES (?, 'facebook', ?) ON DUPLICATE KEY UPDATE active_facebook_page_id = VALUES(active_facebook_page_id)`,
                [userEmail, pageId]
            );
        }

        return NextResponse.json({ success: true, message: 'Active page updated successfully.' });
    } catch (error) {
        console.error("Error setting active Facebook page:", error);
        return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
    }
}