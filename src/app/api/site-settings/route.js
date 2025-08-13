// src/app/api/site-settings/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// This file now ONLY handles the 'sites' table.

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  const userEmail = session.user.email;
  try {
    const [rows] = await db.query(
      'SELECT site_name, site_url, currency, full_name, email, address, postal_code FROM sites WHERE user_email = ?',
      [userEmail]
    );
    if (rows.length > 0) {
      return NextResponse.json(rows[0], { status: 200 });
    } else {
      return NextResponse.json({ site_name: '', site_url: '', currency: 'USD' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const { siteName, siteUrl, currency } = await request.json();

    if (!siteName || !siteUrl || !currency) {
        return NextResponse.json({ message: 'Site name, URL, and currency are required' }, { status: 400 });
    }
    try {
        const query = `
            INSERT INTO sites (user_email, site_name, site_url, currency, full_name, email, address, postal_code)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                site_name = VALUES(site_name), 
                site_url = VALUES(site_url), 
                currency = VALUES(currency);
        `;
        await db.query(query, [userEmail, siteName, siteUrl, currency]);
        return NextResponse.json({ message: 'Settings saved successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error saving site settings:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
