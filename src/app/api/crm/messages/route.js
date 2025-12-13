import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Ensure this path matches your auth config
import { db } from '@/lib/db';

export async function GET(req) {
    // 1. Security Check
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get the ID from the URL (e.g. ?conversationId=5)
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
        return NextResponse.json({ error: 'Missing Conversation ID' }, { status: 400 });
    }

    try {
        // 3. Fetch Messages from DB
        // We order by created_at ASC so the oldest messages appear at the top
        const [messages] = await db.query(
            `SELECT * FROM crm_messages 
             WHERE conversation_id = ? 
             ORDER BY created_at ASC`,
            [conversationId]
        );

        return NextResponse.json(messages);

    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}