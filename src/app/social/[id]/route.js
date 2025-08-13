import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT handler to update a scheduled post (e.g., when dragged on the calendar)
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
            return NextResponse.json({ message: 'Scheduled time is required.' }, { status: 422 });
        }

        await db.query(
            'UPDATE scheduled_posts SET scheduled_at = ? WHERE id = ? AND user_email = ?',
            [new Date(scheduled_at), id, userEmail]
        );
        return NextResponse.json({ message: 'Post schedule updated.' }, { status: 200 });
    } catch (error) {
        console.error('Error updating scheduled post:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE handler to remove a scheduled post
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const { id } = params;

    try {
        await db.query(
            'DELETE FROM scheduled_posts WHERE id = ? AND user_email = ?',
            [id, userEmail]
        );
        return NextResponse.json({ message: 'Scheduled post deleted.' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting scheduled post:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}