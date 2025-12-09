import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { conversationId, text } = await req.json();

        // 1. Get Conversation Details (We need the phone number)
        const [convRows] = await db.query(
            'SELECT external_id, platform FROM crm_conversations WHERE id = ? AND user_email = ?',
            [conversationId, session.user.email]
        );

        if (convRows.length === 0) throw new Error("Conversation not found");
        
        const { external_id: customerPhone } = convRows[0];

        // 2. Send to Meta API
        const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        
        const metaRes = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: customerPhone,
                type: "text",
                text: { body: text }
            })
        });

        const metaData = await metaRes.json();
        
        if (!metaRes.ok) {
            throw new Error(metaData.error?.message || "Failed to send WhatsApp message");
        }

        // 3. Save "Outbound" Message to DB
        await db.query(`
            INSERT INTO crm_messages (conversation_id, direction, content, status)
            VALUES (?, 'outbound', ?, 'sent')
        `, [conversationId, text]);

        // 4. Update Conversation "Last Message"
        await db.query(`
            UPDATE crm_conversations 
            SET last_message = ?, updated_at = NOW(), unread_count = 0 
            WHERE id = ?
        `, [`You: ${text}`, conversationId]);

        return NextResponse.json({ success: true, messageId: metaData.messages?.[0]?.id });

    } catch (error) {
        console.error("CRM Send Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}