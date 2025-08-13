// File: src/app/api/images/[id]/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    const userEmail = session.user.email;

    try {
        // This query ensures a user can only delete their own images
        const [result] = await db.query(
            'DELETE FROM user_images WHERE id = ? AND user_email = ?',
            [id, userEmail]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Image not found or you do not have permission to delete it.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error(`Error deleting image ${id}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}