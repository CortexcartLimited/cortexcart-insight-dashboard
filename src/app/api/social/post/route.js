// src/app/api/social/post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user_email = session.user.email;

    let postData;
    try {
        postData = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 });
    }

    const { platform, content, image_url, video_url, title, board_id } = postData;

    let endpoint;
    let payload = {};

    try {
        switch (platform) {
            case 'x':
                endpoint = '/api/social/x/create-post';
                payload = { user_email, content, imageUrl: image_url };
                break;
            case 'facebook':
                endpoint = '/api/social/facebook/create-post';
                payload = { user_email, content, imageUrl: image_url };
                break;
            case 'instagram':
                endpoint = '/api/social/instagram/accounts/post';
                // Fetch the active instagram_user_id for this user
                const [igRows] = await db.query(
                    `SELECT active_instagram_user_id FROM social_connect WHERE user_email = ? AND platform = 'instagram'`,
                    [user_email]
                );
                if (!igRows.length || !igRows[0].active_instagram_user_id) {
                    throw new Error(`No active Instagram account found for user ${user_email}`);
                }
                payload = { 
                    user_email, 
                    caption: content, 
                    imageUrl: image_url, 
                    instagramUserId: igRows[0].active_instagram_user_id 
                };
                break;
            // Add cases for your other platforms (Pinterest, YouTube) here
            default:
                throw new Error(`Unknown platform: ${platform}`);
        }

        // --- START OF FIX ---
        // This fetch call now includes the "Content-Type" header,
        // which solves the "Failed to parse body as FormData" error.
        const postResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // <-- THIS IS THE FIX
                'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
            },
            body: JSON.stringify(payload),
        });
        // --- END OF FIX ---

        if (!postResponse.ok) {
            const errorData = await postResponse.json();
            throw new Error(errorData.error || `API returned status ${postResponse.status}`);
        }

        const result = await postResponse.json();
        return NextResponse.json({ success: true, result });

    } catch (error) {
        console.error(`[SOCIAL POST] Failed to post to ${platform}:`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}