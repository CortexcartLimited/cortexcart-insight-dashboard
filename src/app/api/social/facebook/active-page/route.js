// src/app/api/social/facebook/active-page/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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
            // We have an active page, let's get its details
            const [pageDetails] = await db.query(
                `SELECT page_id FROM social_connect WHERE user_email = ? AND platform = 'facebook' AND page_id = ?`,
                [userEmail, rows[0].active_facebook_page_id]
            );

            if (pageDetails.length > 0) {
                 return NextResponse.json({ pageId: pageDetails[0].page_id, pageName: pageDetails[0].account_name });
            }
        }
        
        return NextResponse.json(null); // No active page set

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

    try {
        // CORRECTED: Updates the 'active_facebook_page_id' column in the existing 'social_connect' table.
        const [updateResult] = await db.query(
            `UPDATE social_connect SET active_facebook_page_id = ? WHERE user_email = ? AND platform = 'facebook'`,
            [pageId, userEmail]
        );

        if (updateResult.affectedRows === 0) {
            // This can happen if the user has never connected facebook before, let's insert it
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