// In src/app/api/social/pinterest/post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { boardId, imageUrl, title, description } = await request.json();
    if (!boardId || !imageUrl || !title) {
        return NextResponse.json({ error: 'Board ID, Image URL, and Title are required.' }, { status: 400 });
    }

    try {
        const [connections] = await db.query(
            `SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'pinterest'`,
            [session.user.email]
        );

        if (connections.length === 0) {
            return NextResponse.json({ error: 'Pinterest account not connected.' }, { status: 404 });
        }

        const accessToken = decrypt(connections[0].access_token_encrypted);
        
        const response = await axios.post(`${process.env.PINTEREST_API_URL}/v5/pins`, pinData, {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
});
        // --- NEW DEBUG LOGS ---
        console.log('[DEBUG] Using Access Token starting with:', accessToken.substring(0, 15));
        
        const pinData = {
            board_id: boardId,
            title: title,
            description: description || '',
            media_source: {
                source_type: 'image_url',
                url: imageUrl
            }
        };

        console.log('[DEBUG] Sending this Pin Data to Pinterest:', JSON.stringify(pinData, null, 2));
        // --- END OF NEW DEBUG LOGS ---

        return NextResponse.json({ success: true, pinId: response.data.id }, { status: 201 });

    } catch (error) {
        // --- MODIFIED ERROR LOGGING ---
        console.error('[DEBUG] Full Pinterest API Error:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'Failed to post to Pinterest.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}