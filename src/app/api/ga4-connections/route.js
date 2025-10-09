import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * @description Fetches all GA4 connections for the logged-in user.
 * @method GET
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
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

/**
 * @description Adds a new GA4 property connection for the logged-in user.
 * @method POST
 */
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { propertyId } = await req.json();

    if (!propertyId || !/^\d+$/.test(propertyId)) {
        return NextResponse.json({ message: 'Invalid Property ID format.' }, { status: 400 });
    }

    try {
        // First, check if this property already exists for the user
        const [existing] = await db.query(
            'SELECT id FROM ga4_connections WHERE user_email = ? AND ga4_property_id = ?',
            [session.user.email, propertyId]
        );

        // If a record is found, return a conflict error
        if (existing.length > 0) {
            return NextResponse.json({ message: 'This property has already been added.' }, { status: 409 });
        }

        // If no duplicate is found, insert the new property
        const [result] = await db.query(
            'INSERT INTO ga4_connections (user_email, ga4_property_id) VALUES (?, ?)',
            [session.user.email, propertyId]
        );
        
        const [newConnection] = await db.query(
            'SELECT id, ga4_property_id FROM ga4_connections WHERE id = ?',
            [result.insertId]
        );

        return NextResponse.json(newConnection[0], { status: 201 });
    } catch (error) {
        // This will catch the unique constraint violation if the API check somehow fails
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ message: 'This property has already been added.' }, { status: 409 });
        }
        console.error('Error adding GA4 connection:', error);
        return NextResponse.json({ message: 'Failed to add GA4 connection' }, { status: 500 });
    }
}

/**
 * @description Deletes a specific GA4 connection for the logged-in user.
 * @method DELETE
 */
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