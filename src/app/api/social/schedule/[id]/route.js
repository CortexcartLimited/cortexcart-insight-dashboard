import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

// Helper function to format a date for MySQL DATETIME
function formatForMySQL(isoDate) {
    return new Date(isoDate).toISOString().slice(0, 19).replace('T', ' ');
}

// PUT handler to update a scheduled post's date
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const { id } = await params;

    try {
        const { scheduled_at } = await request.json();
        if (!scheduled_at) {
            return NextResponse.json({ message: 'Scheduled time is required.' }, { status: 400 });
        }

        const mysqlFormattedDateTime = formatForMySQL(scheduled_at);

        await db.query(
            'UPDATE scheduled_posts SET scheduled_at = ? WHERE id = ? AND user_email = ?',
            [mysqlFormattedDateTime, id, userEmail]
        );
        return NextResponse.json({ message: 'Post schedule updated successfully.' }, { status: 200 });
    } catch (error) {
        console.error('Error updating scheduled post:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}