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

    const { videoId, imageUrl } = await request.json();
    if (!videoId || !imageUrl) {
        return NextResponse.json({ error: 'Video ID and Image URL are required.' }, { status: 400 });
    }

    try {
        // Retrieve the user's Google access token
        const [connections] = await db.query(
            `SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'google'`,
            [session.user.email]
        );
        if (connections.length === 0) throw new Error('Google account not connected.');
        
        const accessToken = decrypt(connections[0].access_token_encrypted);

        // Fetch the image from the URL into a buffer
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        const imageContentType = imageResponse.headers['content-type'];

        // Upload the thumbnail image to YouTube
        await axios.post(
            `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
            imageBuffer,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': imageContentType,
                    'Content-Length': imageBuffer.length,
                },
            }
        );

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Error setting YouTube thumbnail:', error.response?.data?.error || error.message);
        const errorMessage = error.response?.data?.error?.message || 'Failed to set thumbnail.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}