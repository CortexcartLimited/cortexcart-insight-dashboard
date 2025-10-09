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
    const newData = await request.json();

    try {
        // 1. Fetch existing settings first
        const [existingRows] = await db.query('SELECT * FROM sites WHERE user_email = ? LIMIT 1', [userEmail]);
        const existingSettings = existingRows[0] || {};

        // 2. Merge existing settings with new data
        //    The new data from the request will overwrite the old data for the fields provided.
        const finalData = {
            siteName: newData.siteName !== undefined ? newData.siteName : existingSettings.site_name,
            siteUrl: newData.siteUrl !== undefined ? newData.siteUrl : existingSettings.site_url,
            fullName: newData.fullName !== undefined ? newData.fullName : existingSettings.full_name,
            email: newData.email !== undefined ? newData.email : existingSettings.email,
            address: newData.address !== undefined ? newData.address : existingSettings.address,
            postalCode: newData.postalCode !== undefined ? newData.postalCode : existingSettings.postal_code,
            currency: newData.currency !== undefined ? newData.currency : existingSettings.currency,
        };
        
        // 3. Validate that the essential fields have a value (either new or existing)
        if (!finalData.siteName || !finalData.siteUrl || !finalData.currency) {
            return NextResponse.json({ message: 'Site name, URL, and currency are required' }, { status: 400 });
        }

        // 4. Run your original query with the complete, merged data
        const query = `
            INSERT INTO sites (user_email, site_name, site_url, full_name, email, address, postal_code, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                site_name = VALUES(site_name),
                site_url = VALUES(site_url),
                full_name = VALUES(full_name),
                email = VALUES(email),
                address = VALUES(address),
                postal_code = VALUES(postal_code),
                currency = VALUES(currency);
        `;

        await db.query(query, [
            userEmail, 
            finalData.siteName, 
            finalData.siteUrl, 
            finalData.fullName, 
            finalData.email, 
            finalData.address, 
            finalData.postalCode, 
            finalData.currency
        ]);

        return NextResponse.json({ message: 'Settings saved successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error saving site settings:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
