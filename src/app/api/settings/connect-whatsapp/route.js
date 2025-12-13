import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { phoneId, accessToken } = await req.json();

    if (!phoneId || !accessToken) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    try {
        // 1. TEST THE CREDENTIALS (Validate with Meta)
        // We try to fetch the phone number details. If this fails, the token/ID is wrong.
        const metaTest = await fetch(`https://graph.facebook.com/v19.0/${phoneId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!metaTest.ok) {
            return NextResponse.json({ error: 'Invalid Credentials. Meta rejected the connection.' }, { status: 400 });
        }

        const metaData = await metaTest.json();
        // Check if verified name exists, otherwise use 'WhatsApp User'
        const accountName = metaData.verified_name || 'WhatsApp Business';

        // 2. SAVE TO DATABASE (Insert or Update)
        // We use 'ON DUPLICATE KEY UPDATE' to allow users to update their token later
        await db.query(
            `INSERT INTO social_connect (user_email, platform, page_id, access_token, connected_at)
             VALUES (?, 'whatsapp', ?, ?, NOW())
             ON DUPLICATE KEY UPDATE 
             access_token = VALUES(access_token), 
             page_id = VALUES(page_id),
             connected_at = NOW()`,
            [session.user.email, phoneId, accessToken]
        );

        return NextResponse.json({ success: true, name: accountName });

    } catch (error) {
        console.error("Connection Error:", error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}