// src/app/api/social/instagram/active-account/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server'; // CORRECTED IMPORT

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT active_instagram_account_id FROM social_connect WHERE email = ?',
            [session.user.email]
        );

        if (rows.length === 0) {
            return NextResponse.json({ active_instagram_account_id: null }, { status: 404 });
        }

        return NextResponse.json({ active_instagram_account_id: rows[0].active_instagram_account_id }, { status: 200 });

    } catch (error) {
        console.error('Error fetching active Instagram account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}