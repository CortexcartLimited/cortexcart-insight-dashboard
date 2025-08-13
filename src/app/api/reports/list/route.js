// src/app/api/reports/list/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

// GET handler to fetch a list of reports for the user
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [reports] = await db.query(
            'SELECT id, report_type, status, created_at FROM generated_reports WHERE user_email = ? ORDER BY created_at DESC',
            [session.user.email]
        );
        return NextResponse.json(reports, { status: 200 });
    } catch (error) {
        console.error('Error fetching report list:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
