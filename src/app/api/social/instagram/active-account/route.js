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
        console.log(`Setting active Instagram ID for ${userEmail} to ${instagramId}`); // Add logging

        // --- START OF FIX ---
        // Updates the CORRECT 'active_instagram_user_id' column
        // for the CORRECT 'instagram' platform row.
        const [updateResult] = await db.query(
            `UPDATE social_connect
             SET active_instagram_user_id = ?
             WHERE user_email = ? AND platform = 'instagram'`, // Corrected column and platform
            [instagramId, userEmail]
        );
        // --- END OF FIX ---

        // Check if a row was actually updated
        if (updateResult.affectedRows === 0) {
            // Attempt to insert if the row doesn't exist (optional, depends on your connection flow)
            // For now, we assume the 'instagram' row should exist if they can select an account.
            console.warn(`No social_connect entry found for user ${userEmail} and platform 'instagram'. Attempting update failed.`);
            // You might want to return a different error or try an INSERT/UPSERT here
             // depending on how initial connections are created.
            throw new Error('Could not find the social_connect entry for Instagram to update. Please ensure the main Instagram connection exists.');
        }

        console.log(`Successfully updated active Instagram ID for ${userEmail}`);
        return NextResponse.json({ success: true, message: 'Active Instagram account updated.' });

    } catch (error) {
        console.error("Error setting active Instagram account:", error);
        return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
    }
}