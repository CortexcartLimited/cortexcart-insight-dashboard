// src/app/api/ga4-connections/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const PROPERTY_LIMIT = 6; // The limit for how many properties can be added.

// GET - Fetches all connected GA4 properties for the user
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT ga4_property_id, property_id FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching GA4 properties:", error);
        return NextResponse.json({ error: 'Failed to fetch GA4 properties.' }, { status: 500 });
    }
}

// POST - Adds a new GA4 property, respecting the limit
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { propertyId } = await req.json();
        if (!propertyId || !/^\d+$/.test(propertyId)) {
            return NextResponse.json({ error: 'A valid GA4 Property ID (numbers only) is required.' }, { status: 400 });
        }

        const [currentProperties] = await db.query(
            'SELECT COUNT(*) as count FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (currentProperties[0].count >= PROPERTY_LIMIT) {
            return NextResponse.json({ error: `You have reached the limit of ${PROPERTY_LIMIT} properties.` }, { status: 403 });
        }

        const [result] = await db.query(
            'INSERT INTO ga4_connections (user_email, ga4_property_id) VALUES (?, ?)',
            [session.user.email, propertyId]
        );

        return NextResponse.json({ success: true, ga4_property_id: result.insertId, property_id: propertyId });

    } catch (error) {
        // Handle cases where the property ID is already in use (unique constraint)
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'This GA4 Property ID is already connected.' }, { status: 409 });
        }
        console.error("Error adding GA4 property:", error);
        return NextResponse.json({ error: 'Failed to add GA4 property.' }, { status: 500 });
    }
}

// DELETE - Removes a GA4 property
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await req.json(); // We'll delete by the unique row ID
        if (!id) {
            return NextResponse.json({ error: 'Property ID is required for deletion.' }, { status: 400 });
        }

        await db.query(
            'DELETE FROM ga4_connections WHERE property_id = ? AND user_email = ?',
            [id, session.user.email]
        );

        return NextResponse.json({ success: true, message: 'Property disconnected successfully.' });

    } catch (error) {
        console.error("Error deleting GA4 property:", error);
        return NextResponse.json({ error: 'Failed to delete GA4 property.' }, { status: 500 });
    }
}