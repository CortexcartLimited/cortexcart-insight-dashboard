import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Using your raw MySQL connection

// 1. VERIFICATION (Meta calls this when you first set up the webhook)
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Check if the token matches your .env variable
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        console.log("✅ WhatsApp Webhook Verified!");
        return new NextResponse(challenge, { status: 200 });
    } else {
        return new NextResponse('Forbidden', { status: 403 });
    }
}

// 2. RECEIVE MESSAGES (Meta calls this when a customer messages you)
export async function POST(req) {
    try {
        const body = await req.json();

        // Check if this is a WhatsApp status update or message
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (value?.messages) {
            const message = value.messages[0];
            const senderPhone = message.from; // Customer phone number
            const messageBody = message.text?.body; // The text content
            const messageType = message.type;

            if (messageType === 'text') {
                console.log(`📩 New WhatsApp Message from ${senderPhone}: ${messageBody}`);

                // --- SAVE TO DATABASE ---
                // 1. Find or Create Conversation
                // We assume 'admin' email for now, or you'd need logic to map phones to users
                // For a single-tenant app, you can use a default email or match via other means.
                const userEmail = "millarsfoods@gmail.com"; // REPLACE with logic if multi-tenant

                // Upsert Conversation
                await db.query(`
                    INSERT INTO crm_conversations 
                    (user_email, platform, external_id, contact_name, last_message, unread_count, updated_at)
                    VALUES (?, 'whatsapp', ?, ?, ?, 1, NOW())
                    ON DUPLICATE KEY UPDATE 
                        last_message = VALUES(last_message),
                        unread_count = unread_count + 1,
                        updated_at = NOW()
                `, [userEmail, senderPhone, `Customer ${senderPhone.slice(-4)}`, messageBody]);

                // Get Conversation ID
                const [convRows] = await db.query(
                    'SELECT id FROM crm_conversations WHERE platform = ? AND external_id = ?', 
                    ['whatsapp', senderPhone]
                );
                
                if (convRows.length > 0) {
                    const conversationId = convRows[0].id;
                    
                    // Insert Message
                    await db.query(`
                        INSERT INTO crm_messages (conversation_id, direction, content, status)
                        VALUES (?, 'inbound', ?, 'received')
                    `, [conversationId, messageBody]);
                }
            }
        }

        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        console.error("WhatsApp Webhook Error:", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}