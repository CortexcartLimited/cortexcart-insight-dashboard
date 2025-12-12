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

    const { platform, content, image_url } = postData;

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
            default:
                throw new Error(`Unknown platform: ${platform}`);
        }

        // --- DEBUGGING START ---
        // 1. Construct and Log the Target URL
            const port = process.env.PORT || 3000;
            const baseUrl = `http://127.0.0.1:${port}`;
            const targetUrl = `${baseUrl}${endpoint}`;
        console.log(`[SOCIAL POST] Fetching internal API: ${targetUrl}`);

        const postResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
            },
            body: JSON.stringify(payload),
        });

        // 2. Handle Non-OK Responses Safely
        if (!postResponse.ok) {
            const contentType = postResponse.headers.get("content-type");
            
            // If it's HTML, log the text to debug (It might be a 404 page or Cloudflare)
            if (contentType && contentType.includes("text/html")) {
                const htmlText = await postResponse.text();
                console.error(`[SOCIAL POST] Internal API returned HTML Error (${postResponse.status}):`, htmlText.substring(0, 200)); // Log first 200 chars
                throw new Error(`Internal API Failed with HTML (${postResponse.status}). Check server logs.`);
            }

            // If it's JSON, parse normally
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