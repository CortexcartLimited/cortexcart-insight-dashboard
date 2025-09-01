// src/app/api/social/pinterest/boards/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all boards for the logged-in user from your database
        const [boards] = await db.query(
            'SELECT board_id, board_name FROM pinterest_boards WHERE user_email = ?',
            [session.user.email]
        );
        
        // Format the data to have value/label properties for the dropdown
        const formattedBoards = boards.map(board => ({
            value: board.board_id,
            label: board.board_name
        }));

        return NextResponse.json(formattedBoards, { status: 200 });
    } catch (error) {
        console.error('Error fetching Pinterest boards:', error);
        return NextResponse.json({ error: 'Failed to fetch Pinterest boards' }, { status: 500 });
    }
}