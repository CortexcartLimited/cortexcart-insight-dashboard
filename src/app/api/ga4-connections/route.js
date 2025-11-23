import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/crypto'; 

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // FIX: Removed 'id' from selection. user_email is the key.
        const [connections] = await db.query(
            'SELECT ga4_property_id FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );
        
        // We synthesize a fake 'id' so the frontend React keys don't break
        const formatted = connections.map(c => ({
            id: 'primary', 
            ga4_property_id: c.ga4_property_id
        }));

        return NextResponse.json(formatted, { status: 200 });
    } catch (error) {
        console.error('Error fetching GA4 connections:', error);
        return NextResponse.json({ message: 'Failed to fetch connections' }, { status: 500 });
    }
}

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

        // FIX: Use 'ON DUPLICATE KEY UPDATE'
        // Since your schema limits 1 connection per user (user_email is Primary Key),
        // this command will Insert if new, or Update if one already exists.
        await db.query(
            `INSERT INTO ga4_connections (user_email, ga4_property_id, credentials_json) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             ga4_property_id = VALUES(ga4_property_id), 
             credentials_json = VALUES(credentials_json)`,
            [session.user.email, propertyId, encryptedCredentials]
        );
        
        return NextResponse.json({
            id: 'primary', // Fake ID for frontend
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
        // FIX: Delete based on user_email only (ignore the ID passed from frontend)
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