import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET() {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // 2. Retrieve the user's credentials from your database
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

        if (!accessToken || !serverPrefix) {
            throw new Error('Could not retrieve valid credentials for Mailchimp.');
        }

        // 3. Call the Mailchimp API to get the 5 most recent campaigns and their reports
        const mailchimpApiUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/campaigns`;
        
        const response = await axios.get(mailchimpApiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                count: 5, // Get the 5 most recent campaigns
                sort_field: 'send_time',
                sort_dir: 'DESC',
                // This 'fields' parameter is an optimization to only get the data we need
                fields: 'campaigns.id,campaigns.settings.subject_line,campaigns.status,campaigns.send_time,campaigns.report_summary'
            }
        });

        // 4. Return the list of campaigns to the frontend
        return NextResponse.json(response.data.campaigns);

    } catch (error) {
        console.error('Mailchimp API Error:', error.response?.data || error.message);
        return NextResponse.json({ message: 'Failed to fetch Mailchimp campaigns.' }, { status: 500 });
    }
}