// src/app/api/social/pinterest/boards/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [connectRows] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'pinterest']
        );

        if (connectRows.length === 0) {
            return NextResponse.json([]);
        }

        const accessToken = decrypt(connectRows[0].access_token_encrypted);

        const response = await axios.get('https://api.pinterest.com/v5/boards', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const boardsFromApi = response.data.items || [];

        // ✅ FIX: Map the board data to the format expected by the frontend
        const formattedBoards = boardsFromApi.map(board => ({
            board_id: board.id,
            board_name: board.name
        }));

        return NextResponse.json(formattedBoards);

    } catch (error) {
        console.error('Error fetching Pinterest boards:', error.response ? error.response.data : error.message);
        return NextResponse.json({ error: 'Failed to fetch Pinterest boards' }, { status: 500 });
    }
}