import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function GET(req) {
    console.log('--- STARTING /api/social/connections/status ---');

    let session;
    try {
        session = await getServerSession(authOptions);
        console.log('Step 1: Session fetched successfully.');
    } catch (e) {
        console.error('CRITICAL: Failed to get server session.', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!session || !session.user) {
        console.log('Step 1.1: No session or user found. Unauthorized.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`Step 1.2: Authenticated as ${session.user.email}`);

    try {
        console.log('Step 2: Attempting to query database...');
        const [rows] = await db.query(
            'SELECT platform, access_token_encrypted FROM social_connect WHERE user_email = ?',
            [session.user.email]
        );
        console.log(`Step 3: Database query successful. Found ${rows.length} rows.`);
        console.log('Step 3.1: Rows data:', JSON.stringify(rows, null, 2));

        const requiredPlatforms = ['facebook', 'instagram', 'mailchimp', 'pinterest', 'twitter', 'youtube'];
        const connections = {};

        console.log('Step 4: Starting to process platforms...');
        for (const platform of requiredPlatforms) {
            console.log(`-- Processing platform: ${platform} --`);
            const row = rows.find(r => r.platform === platform);
            let isConnected = false;

            if (row && row.access_token_encrypted) {
                console.log(`Platform ${platform}: Found encrypted token. Type: ${typeof row.access_token_encrypted}`);

                if (typeof row.access_token_encrypted !== 'string') {
                    console.error(`Platform ${platform}: Corrupt data detected! access_token_encrypted is not a string.`);
                    isConnected = false;
                } else {
                    const decryptedToken = decrypt(row.access_token_encrypted);
                    console.log(`Platform ${platform}: Decryption attempted. Result is null? ${decryptedToken === null}`);
                    isConnected = !!decryptedToken;
                }
            } else {
                console.log(`Platform ${platform}: No row or token found. Marking as not connected.`);
            }
            connections[platform] = isConnected;
            console.log(`-- Finished platform: ${platform}. Status: ${isConnected} --`);
        }

        console.log('Step 5: Finished processing all platforms.');
        console.log('Step 5.1: Final connections object:', connections);

        return NextResponse.json(connections);

    } catch (error) {
        console.error('--- ERROR in /api/social/connections/status ---');
        console.error('Error occurred at an unexpected point:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}