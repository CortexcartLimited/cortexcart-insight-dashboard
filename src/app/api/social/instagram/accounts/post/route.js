// File: src/app/api/social/instagram/post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if needed for your authOptions
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto'; // Adjust path if needed

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Expect instagramUserId, imageUrl, and caption from the frontend
    const { instagramUserId, imageUrl, caption } = await request.json();
    if (!instagramUserId || !imageUrl || !caption) {
        return NextResponse.json({ error: 'Missing required parameters: instagramUserId, imageUrl, and caption are required.' }, { status: 400 });
    }

    try {
        // 1. Get the stored access token for the selected Instagram account
        const [accounts] = await db.query(
            'SELECT access_token_encrypted FROM instagram_accounts WHERE user_email = ? AND instagram_user_id = ?',
            [session.user.email, instagramUserId]
        );

        if (accounts.length === 0) {
            return NextResponse.json({ error: 'Instagram account not connected or found.' }, { status: 404 });
        }

        const accessToken = decrypt(accounts[0].access_token_encrypted);
        const graphApiVersion = 'v19.0'; // Using a recent and stable API version

        // 2. Step 1 of Instagram Posting: Create a media container
        const createContainerResponse = await axios.post(
            `https://graph.facebook.com/${graphApiVersion}/${instagramUserId}/media`,
            null, // Use null for the body when parameters are in the URL
            {
                params: {
                    image_url: imageUrl,
                    caption: caption,
                    access_token: accessToken,
                }
            }
        );

        const creationId = createContainerResponse.data.id;
        if (!creationId) {
            throw new Error('Failed to create media container.');
        }

        // 3. Step 2 of Instagram Posting: Publish the container
        const publishResponse = await axios.post(
            `https://graph.facebook.com/${graphApiVersion}/${instagramUserId}/media_publish`,
            null, // Use null for the body
            {
                params: {
                    creation_id: creationId,
                    access_token: accessToken,
                }
            }
        );

        return NextResponse.json({ success: true, postId: publishResponse.data.id }, { status: 200 });

    } catch (error) {
        console.error('Error posting to Instagram:', error.response?.data?.error || error.message);
        const errorMessage = error.response?.data?.error?.message || 'An unknown error occurred while posting to Instagram.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}