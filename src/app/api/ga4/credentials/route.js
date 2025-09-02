import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/crypto';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT property_id, credentials_encrypted FROM ga4_credentials WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length === 0) {
            return NextResponse.json({ propertyId: '', credentials: null });
        }

        const { property_id, credentials_encrypted } = rows[0];
        let credentials = null;

        if (credentials_encrypted) {
            try {
                // Safely attempt to decrypt and parse the credentials
                const decryptedData = decrypt(credentials_encrypted);
                if (decryptedData) {
                    credentials = JSON.parse(decryptedData);
                }
            } catch (decryptionError) {
                console.error('Failed to decrypt GA4 credentials for user:', session.user.email, decryptionError.message);
                // If decryption fails, treat credentials as not set.
                // This prevents the page from crashing due to corrupt data.
                credentials = null;
            }
        }

        return NextResponse.json({ propertyId: property_id, credentials });
    } catch (error) {
        // This will catch database errors or other unexpected issues
        console.error('Error fetching GA4 credentials:', error);
        return NextResponse.json({ message: 'Error fetching GA4 credentials.' }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { propertyId, credentials } = await req.json();

        if (!propertyId || !credentials) {
            return NextResponse.json({ message: 'Property ID and credentials are required.' }, { status: 400 });
        }

        const credentialsString = JSON.stringify(credentials);
        const credentials_encrypted = encrypt(credentialsString);

        const query = `
            INSERT INTO ga4_connections (user_email, property_id, credentials_encrypted)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
            property_id = VALUES(property_id),
            credentials_encrypted = VALUES(credentials_encrypted);
        `;

        await db.query(query, [session.user.email, propertyId, credentials_encrypted]);

        return NextResponse.json({ message: 'GA4 credentials updated successfully.' });
    } catch (error) {
        console.error('Error updating GA4 credentials:', error);
        return NextResponse.json({ message: 'Error updating GA4 credentials.' }, { status: 500 });
    }
}