import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

// We are no longer using the Google AI SDK in this file

// GET handler to fetch all tickets for the logged-in user
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        const [tickets] = await db.query(
            'SELECT * FROM support_tickets WHERE user_email = ? ORDER BY updated_at DESC',
            [userEmail]
        );
        return NextResponse.json(tickets, { status: 200 });
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST handler to create a new support ticket and generate an AI reply
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;

    let newTicketId;

    try {
        const { subject, category, message } = await request.json();
        if (!subject || !category || !message) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            // Step 1: Insert the main ticket
            const [ticketResult] = await connection.query(
                'INSERT INTO support_tickets (user_email, subject, category) VALUES (?, ?, ?)',
                [userEmail, subject, category]
            );
            newTicketId = ticketResult.insertId;

            // Step 2: Insert the user's initial message
            await connection.query(
                'INSERT INTO ticket_replies (ticket_id, author_email, message) VALUES (?, ?, ?)',
                [newTicketId, userEmail, message]
            );
            
            await connection.commit();
        } catch (dbError) {
            await connection.rollback();
            throw dbError; 
        } finally {
            connection.release();
        }

        // --- Step 3: Attempt to Generate AI Reply & Notification ---
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("AI Service is not configured.");
            }
            
            const prompt = `You are a helpful support agent for CortexCart... The user's subject is "${subject}" and their message is: "${message}"`;
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiMessage = response.text();

            if (aiMessage) {
                // Save the AI's reply
                await db.query(
                    'INSERT INTO ticket_replies (ticket_id, author_email, message, is_ai_reply) VALUES (?, ?, ?, ?)',
                    [newTicketId, 'ai-support@cortexcart.com', aiMessage, true]
                );

                // --- NEW: Create a notification for the user ---
                const notificationMessage = `You have a new reply on your ticket: "${subject}"`;
                const notificationLink = `/support/${newTicketId}`;
                await db.query(
                    'INSERT INTO notifications (user_email, message, link) VALUES (?, ?, ?)',
                    [userEmail, notificationMessage, notificationLink]
                );
            }
        } catch (aiError) {
            console.error(`AI reply and notification failed for Ticket ${newTicketId}, but ticket was created: ${aiError.message}`);
        }

        return NextResponse.json({ message: 'Support ticket created successfully.', ticketId: newTicketId }, { status: 201 });

    } catch (error) {
        console.error('Critical error during ticket creation:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
