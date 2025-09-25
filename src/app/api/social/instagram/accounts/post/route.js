// src/app/api/social/instagram/accounts/post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instagramUserId, imageUrl, caption } = await req.json();

    try {
          const [accountResults] = await db.query(
            `SELECT page_id FROM instagram_accounts WHERE instagram_id = ? AND user_email = ?`,
            [instagramId, session.user.email]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Instagram account not found.' }, { status: 404 });
        }
        
        const accessToken = decrypt(rows[0].page_access_token_encrypted);
        
        // --- THE FIX: Convert the relative imageUrl to an absolute URL ---
        const absoluteImageUrl = new URL(imageUrl, process.env.NEXTAUTH_URL).href;

        // Step 1: Create media container
        const createContainerResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${instagramUserId}/media`, {
                image_url: absoluteImageUrl,
                caption: caption,
                access_token: accessToken,
            }
        );

        const creationId = createContainerResponse.data.id;
        if (!creationId) {
            throw new Error('Failed to create media container.');
        }

        // Step 2: Publish the media container
        await axios.post(
            `https://graph.facebook.com/v19.0/${instagramUserId}/media_publish`, {
                creation_id: creationId,
                access_token: accessToken,
            }
        );

        return NextResponse.json({ success: true, message: 'Posted to Instagram successfully.' });

    } catch (error) {
        console.error("Error posting to Instagram:", error.response ? error.response.data.error : error.message);
        const fbError = error.response?.data?.error;
        if (fbError) {
            if (fbError.code === 190) { // Specific code for expired/invalid tokens
                 return NextResponse.json({
                    error: "Your Facebook/Instagram connection has expired. Please go to settings and reconnect your Facebook account."
                }, { status: 401 });
            }
            return NextResponse.json({ error: `Instagram Error: ${fbError.message}` }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unexpected server error occurred while posting to Instagram.' }, { status: 500 });
    }
}