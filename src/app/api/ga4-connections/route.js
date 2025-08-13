// src/app/api/ga4-connections/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET handler: Fetches just the GA4 property ID.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  const userEmail = session.user.email;
  try {
    const [rows] = await db.query(
      'SELECT ga4_property_id FROM ga4_connections WHERE user_email = ?',
      [userEmail]
    );
    return NextResponse.json({ ga4_property_id: rows[0]?.ga4_property_id || '' }, { status: 200 });
  } catch (error) {
    console.error('Error fetching GA4 settings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST handler: Saves just the GA4 property ID.
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const { ga4PropertyId } = await request.json();

    try {
        const query = `
            INSERT INTO ga4_connections (user_email, ga4_property_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE ga4_property_id = VALUES(ga4_property_id);
        `;
        await db.query(query, [userEmail, ga4PropertyId || null]);
        return NextResponse.json({ message: 'GA4 settings saved successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error saving GA4 settings:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
