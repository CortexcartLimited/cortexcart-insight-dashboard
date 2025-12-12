import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { conversationId, text } = await req.json();

        // 1. Get the conversation to find the Recipient's Phone Number
        const [rows] = await db.query(
            'SELECT external_id FROM crm_conversations WHERE id = ? AND user_email = ?',
            [conversationId, session.user.email]
        );

        if (!rows.length) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        const recipientPhone = rows[0].external_id;

        // 2. MULTI-TENANT LOOKUP: Get the User's WhatsApp Credentials
        // We use 'page_id' column to store the WhatsApp Phone Number ID
        const [creds] = await db.query(
            `SELECT access_token_encrypted, page_id FROM social_connect 
             WHERE user_email = ? AND platform = 'whatsapp'`,
            [session.user.email]
        );

        if (!creds.length) {
            return NextResponse.json({ error: 'WhatsApp not connected. Please connect in Settings.' }, { status: 400 });
        }

        const accessToken = creds[0].access_token_encrypted; // (Assuming not actually encrypted yet for simplicity)
        const phoneId = creds[0].page_id; 

        // 3. Send via Meta API using USER'S credentials
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: recipientPhone,
                type: 'text',
                text: { body: text }
            })
        });

        const metaData = await metaRes.json();
        
        if (!metaRes.ok) {
            console.error("Meta API Error:", metaData);
            throw new Error(metaData.error?.message || 'Failed to send message');
        }

        // 4. Save to Database
        await db.query(
            `INSERT INTO crm_messages (conversation_id, direction, content, created_at)
             VALUES (?, 'outbound', ?, NOW())`,
            [conversationId, text]
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}