import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [history] = await db.query(
            'SELECT * FROM payment_history WHERE user_email = ? ORDER BY created_at DESC',
            [session.user.email]
        );
        return NextResponse.json(history, { status: 200 });
    } catch (error) {
        console.error("Error fetching billing history:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
