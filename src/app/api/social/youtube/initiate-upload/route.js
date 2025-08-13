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

    // Get video metadata from the frontend
    const { title, description, privacyStatus } = await request.json();
    if (!title) {
        return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    try {
        // Retrieve the user's Google access token from the database
        const [connections] = await db.query(
            `SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = 'google'`,
            [session.user.email]
        );

        if (connections.length === 0) {
            return NextResponse.json({ error: 'Google account not connected.' }, { status: 404 });
        }

        const accessToken = decrypt(connections[0].access_token_encrypted);

        const videoMetadata = {
            snippet: {
                title: title,
                description: description || '',
            },
            status: {
                privacyStatus: privacyStatus || 'private', // 'public', 'private', or 'unlisted'
            },
        };

        // Make the initial request to the YouTube API to get the upload URL
        const response = await axios.post(
            'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status',
            videoMetadata,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // The upload URL is in the 'Location' header of the response
        const uploadUrl = response.headers.location;

        if (!uploadUrl) {
            throw new Error('Could not retrieve YouTube upload URL.');
        }

        return NextResponse.json({ uploadUrl: uploadUrl }, { status: 200 });

    } catch (error) {
        console.error('Error initiating YouTube upload:', error.response?.data?.error || error.message);
        const errorMessage = error.response?.data?.error?.message || 'Failed to start YouTube upload process.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}