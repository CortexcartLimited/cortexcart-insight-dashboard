import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/crypto'; // We'll use our existing encryption utility

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { propertyId, jsonKey } = await request.json();
        if (!propertyId || !jsonKey) {
            return NextResponse.json({ message: 'GA4 Property ID and JSON Key are required.' }, { status: 400 });
        }

        // Encrypt the sensitive JSON key content before saving
        const encryptedJsonKey = encrypt(JSON.stringify(jsonKey));

        const query = `
            INSERT INTO ga4_connections (user_email, property_id, credentials_json)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                property_id = VALUES(property_id), 
                credentials_json = VALUES(credentials_json);
        `;
        
        await db.query(query, [session.user.email, propertyId, encryptedJsonKey]);

        return NextResponse.json({ message: 'Google Analytics credentials saved successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Error saving GA4 credentials:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
