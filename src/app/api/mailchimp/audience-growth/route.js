import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get the list_id from the query parameters
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');

    if (!listId) {
        return NextResponse.json({ message: 'Audience ID is required.' }, { status: 400 });
    }

    try {
        const [connections] = await db.query(
            'SELECT access_token_encrypted, server_prefix FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'mailchimp']
        );

        if (connections.length === 0) {
            return NextResponse.json({ message: 'Mailchimp account not connected.' }, { status: 404 });
        }

        const connection = connections[0];
        const accessToken = decrypt(connection.access_token_encrypted);
        const serverPrefix = connection.server_prefix;

        // Call the Mailchimp API to get daily activity for the specified list
        const mailchimpApiUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/activity`;
        
        const response = await axios.get(mailchimpApiUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: {
                count: 30 // Get the last 30 days of activity
            }
        });

        // Return the 'activity' array from the response
        return NextResponse.json(response.data.activity);

    } catch (error) {
        console.error('Mailchimp API Error:', error.response?.data || error.message);
        return NextResponse.json({ message: 'Failed to fetch Mailchimp audience activity.' }, { status: 500 });
    }
}