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

        // 1. Basic validation
        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ status: 'ignored' });
        }

        const value = body.entry[0].changes[0].value;
        const metadata = value.metadata; 
        const message = value.messages[0];
        
        const businessPhoneId = metadata.phone_number_id; // <--- THIS ID TELLS US WHO THE USER IS
        const contactPhone = message.from;
        const text = message.text?.body || '[Media/Other]';
        const contactName = value.contacts?.[0]?.profile?.name || 'Unknown';

        // 2. MULTI-TENANT ROUTER: Find the user who owns this WhatsApp Number
        const [users] = await db.query(
            `SELECT user_email FROM social_connect WHERE page_id = ? AND platform = 'whatsapp'`,
            [businessPhoneId]
        );

        if (!users.length) {
            console.warn(`Webhook received for unknown Phone ID: ${businessPhoneId}`);
            return NextResponse.json({ status: 'ignored_unknown_user' });
        }

        const ownerEmail = users[0].user_email; // <--- The correct user email

        // 3. Find or Create Conversation for THAT User
        let [conv] = await db.query(
            `SELECT id FROM crm_conversations WHERE user_email = ? AND external_id = ?`,
            [ownerEmail, contactPhone]
        );

        let conversationId;
        if (conv.length > 0) {
            conversationId = conv[0].id;
            await db.query(
                `UPDATE crm_conversations 
                 SET last_message = ?, updated_at = NOW(), unread_count = unread_count + 1 
                 WHERE id = ?`,
                [text, conversationId]
            );
        } else {
            const [newConv] = await db.query(
                `INSERT INTO crm_conversations 
                 (user_email, platform, external_id, contact_name, last_message, unread_count, updated_at)
                 VALUES (?, 'whatsapp', ?, ?, ?, 1, NOW())`,
                [ownerEmail, contactPhone, contactName, text]
            );
            conversationId = newConv.insertId;
        }

        // 4. Save Message
        await db.query(
            `INSERT INTO crm_messages (conversation_id, direction, content, created_at)
             VALUES (?, 'inbound', ?, NOW())`,
            [conversationId, text]
        );

        return NextResponse.json({ status: 'success' });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}