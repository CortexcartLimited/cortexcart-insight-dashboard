// src/app/api/social/instagram/connect-account/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next-server';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { accountId } = await req.json();
        if (!accountId) {
            return NextResponse.json({ error: 'Instagram Account ID is required.' }, { status: 400 });
        }

        // Update the users table to set the active Instagram account
        await db.query(
            'UPDATE users SET active_instagram_account_id = ? WHERE email = ?',
            [accountId, session.user.email]
        );

        return NextResponse.json({ message: 'Instagram account connected successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Error connecting Instagram account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}