import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/crypto'; // Import encryption helper

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // We select id and property_id, but NEVER return the secrets (credentials_json) to the frontend
        const [connections] = await db.query(
            'SELECT id, ga4_property_id FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );
        return NextResponse.json(connections, { status: 200 });
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

    // FIX: Receive both propertyId AND the credentials JSON string
    const { propertyId, credentials } = await req.json();

    if (!propertyId || !/^\d+$/.test(propertyId)) {
        return NextResponse.json({ message: 'Invalid Property ID format.' }, { status: 400 });
    }

    if (!credentials) {
        return NextResponse.json({ message: 'Service Account JSON file is required.' }, { status: 400 });
    }

    // Validate that the uploaded content is actually JSON
    try {
        JSON.parse(credentials);
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON file format.' }, { status: 400 });
    }

    try {
        const [existing] = await db.query(
            'SELECT id FROM ga4_connections WHERE user_email = ? AND ga4_property_id = ?',
            [session.user.email, propertyId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ message: 'This property has already been added.' }, { status: 409 });
        }

        // FIX: Encrypt the credentials before saving
        const encryptedCredentials = encrypt(credentials);

        const [result] = await db.query(
            'INSERT INTO ga4_connections (user_email, ga4_property_id, credentials_json) VALUES (?, ?, ?)',
            [session.user.email, propertyId, encryptedCredentials]
        );
        
        const [newConnection] = await db.query(
            'SELECT id, ga4_property_id FROM ga4_connections WHERE id = ?',
            [result.insertId]
        );

        return NextResponse.json(newConnection[0], { status: 201 });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ message: 'This property has already been added.' }, { status: 409 });
        }
        console.error('Error adding GA4 connection:', error);
        return NextResponse.json({ message: 'Failed to add GA4 connection' }, { status: 500 });
    }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
        return NextResponse.json({ message: 'Connection ID is required.' }, { status: 400 });
    }

    try {
        const [result] = await db.query(
            'DELETE FROM ga4_connections WHERE id = ? AND user_email = ?',
            [id, session.user.email]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Connection not found or user not authorized.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Connection deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting GA4 connection:', error);
        return NextResponse.json({ message: 'Failed to delete connection' }, { status: 500 });
    }
}