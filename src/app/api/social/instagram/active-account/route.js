// src/app/api/social/instagram/active-account/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) { // Simplified session check
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { instagramId } = await req.json();
    const userEmail = session.user.email;

    // Validate if instagramId was provided
    if (!instagramId) {
        return NextResponse.json({ error: 'Instagram account ID is required.' }, { status: 400 });
    }

    try {
        console.log(`Setting active Instagram ID for ${userEmail} to ${instagramId}`);

        // --- START OF FIX ---
        // Use an "UPSERT" (INSERT ... ON DUPLICATE KEY UPDATE)
        // This creates the row if it doesn't exist OR updates it if it does.
        // This is safer and prevents the "No social_connect entry found" error.
        const [updateResult] = await db.query(
            `INSERT INTO social_connect (user_email, platform, active_instagram_user_id)
             VALUES (?, 'instagram', ?)
             ON DUPLICATE KEY UPDATE active_instagram_user_id = VALUES(active_instagram_user_id)`,
            [userEmail, instagramId]
        );
        // --- END OF FIX ---

        // The old check for affectedRows is no longer needed with an UPSERT,
        // as the query will no longer fail if the row is missing.
        
        console.log(`Successfully set active Instagram ID for ${userEmail}`);
        return NextResponse.json({ success: true, message: 'Active Instagram account updated.' });

    } catch (error) {
        console.error("Error setting active Instagram account:", error);
        // We still keep the original error from your log, in case the UPSERT fails
        // but this is unlikely to be the "not found" error anymore.
        if (error.message.includes('Could not find')) {
             return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
    }
}