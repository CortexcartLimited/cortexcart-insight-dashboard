export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET() {
    console.log("\n--- AUDIENCES API-ROUTE TRIGGERED ---");
    try {
        // 1. Authenticate the user
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            console.log("AUDIENCES API-ROUTE: Step 1 FAILED - Not authenticated");
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }
        console.log("AUDIENCES API-ROUTE: Step 1 SUCCESS - Session found for:", session.user.email);

        // 2. Retrieve the user's credentials from your database
        console.log("AUDIENCES API-ROUTE: Step 2 - Querying database for Mailchimp credentials...");
        const [connections] = await db.query(
            'SELECT access_token_encrypted, server_prefix FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'mailchimp']
        );
        
        console.log("AUDIENCES API-ROUTE: Step 2.5 - Database query result:", connections);

        if (connections.length === 0) {
            console.log("AUDIENCES API-ROUTE: Step 2 FAILED - Mailchimp account not found in database.");
            return NextResponse.json({ message: 'Mailchimp account not connected.' }, { status: 404 });
        }
        console.log("AUDIENCES API-ROUTE: Step 2 SUCCESS - Credentials found.");


        // 3. Decrypt credentials and prepare for API call
        const connection = connections[0];
        const accessToken = decrypt(connection.access_token_encrypted);
        const serverPrefix = connection.server_prefix;

        if (!accessToken || !serverPrefix) {
            console.log("AUDIENCES API-ROUTE: Step 3 FAILED - Credentials could not be decrypted or are invalid.");
            throw new Error('Could not retrieve valid credentials for Mailchimp.');
        }
        console.log("AUDIENCES API-ROUTE: Step 3 SUCCESS - Credentials ready.");
        
        // 4. Call the Mailchimp API
        const mailchimpApiUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists`;
        console.log("AUDIENCES API-ROUTE: Step 4 - Calling Mailchimp API at:", mailchimpApiUrl);
        
        const response = await axios.get(mailchimpApiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        // 5. Log the exact response from Mailchimp
        console.log("AUDIENCES API-ROUTE: Step 5 SUCCESS - Received data from Mailchimp:", JSON.stringify(response.data, null, 2));


        // 6. Return the list of audiences to the frontend
        return NextResponse.json(response.data.lists);

    } catch (error) {
        console.error('AUDIENCES API-ROUTE: FINAL CATCH BLOCK ERROR:', error.response?.data || error.message);
        return NextResponse.json({ message: 'Failed to fetch Mailchimp audiences.' }, { status: 500 });
    }
}