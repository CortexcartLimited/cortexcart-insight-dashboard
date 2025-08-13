import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const { ticketId } = params;

    if (!ticketId) {
        return NextResponse.json({ message: 'Ticket ID is required' }, { status: 400 });
    }

    try {
        const connection = await db.getConnection();
        
        // Fetch the main ticket details and verify ownership
        const [tickets] = await connection.query(
            'SELECT * FROM support_tickets WHERE id = ? AND user_email = ?',
            [ticketId, userEmail]
        );

        if (tickets.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Ticket not found or access denied' }, { status: 404 });
        }
        
        // Fetch all replies for that ticket
        const [replies] = await connection.query(
            'SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC',
            [ticketId]
        );
        
        connection.release();

        const ticketData = {
            ticket: tickets[0],
            replies: replies,
        };

        return NextResponse.json(ticketData, { status: 200 });
    } catch (error) {
        console.error("Error fetching single support ticket:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
