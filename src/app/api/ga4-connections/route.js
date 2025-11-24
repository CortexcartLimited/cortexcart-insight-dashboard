import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/lib/crypto'; // ✅ Make sure decrypt is imported

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Fetch the credentials so we can extract the email
        const [connections] = await db.query(
            'SELECT ga4_property_id, credentials_json FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );
        
        const formatted = connections.map(c => {
            let serviceEmail = 'Unknown';
            try {
                // 1. Try to decrypt (if encrypted)
                let jsonString = decrypt(c.credentials_json);
                // 2. If decrypt fails (returns null), assume it's raw JSON
                if (!jsonString) jsonString = c.credentials_json;
                
                const creds = JSON.parse(jsonString);
                serviceEmail = creds.client_email;
            } catch (e) {
                console.error("Error parsing credentials for email", e);
            }

            return {
                id: 'primary', 
                ga4_property_id: c.ga4_property_id,
                service_email: serviceEmail // ✅ Sending this to the frontend
            };
        });

        return NextResponse.json(formatted, { status: 200 });
    } catch (error) {
        console.error('Error fetching GA4 connections:', error);
        return NextResponse.json({ message: 'Failed to fetch connections' }, { status: 500 });
    }
}

// ... keep POST and DELETE exactly as they were ...
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { propertyId, credentials } = await req.json();

    if (!propertyId || !/^\d+$/.test(propertyId)) {
        return NextResponse.json({ message: 'Invalid Property ID format.' }, { status: 400 });
    }

    if (!credentials) {
        return NextResponse.json({ message: 'Service Account JSON file is required.' }, { status: 400 });
    }

    try {
        JSON.parse(credentials);
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON file format.' }, { status: 400 });
    }

    try {
        const encryptedCredentials = encrypt(credentials);

        await db.query(
            `INSERT INTO ga4_connections (user_email, ga4_property_id, credentials_json) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             ga4_property_id = VALUES(ga4_property_id), 
             credentials_json = VALUES(credentials_json)`,
            [session.user.email, propertyId, encryptedCredentials]
        );
        
        return NextResponse.json({
            id: 'primary', 
            ga4_property_id: propertyId
        }, { status: 201 });

    } catch (error) {
        console.error('Error adding GA4 connection:', error);
        return NextResponse.json({ message: 'Failed to add GA4 connection' }, { status: 500 });
    }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [result] = await db.query(
            'DELETE FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'No connection found to delete.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Connection deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting GA4 connection:', error);
        return NextResponse.json({ message: 'Failed to delete connection' }, { status: 500 });
    }
}