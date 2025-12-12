import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req) {
    const mode = req.nextUrl.searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new NextResponse(challenge);
    }
    return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req) {
    // --- NUCLEAR LOGGING START ---
    console.log("------------------------------------------------");
    console.log("🔥 INCOMING HIT DETECTED 🔥");
    const rawBody = await req.text(); // Read as text first to avoid JSON parsing errors
    console.log("RAW BODY:", rawBody);
    console.log("------------------------------------------------");
    
    if (!rawBody) return NextResponse.json({ status: 'empty' });
    const body = JSON.parse(rawBody); // Parse it back to JSON for the rest of your code
    // --- NUCLEAR LOGGING END ---
    try {
        const body = await req.json();

        // 1. Log the Raw Payload (So we see exactly what Meta sends)
        // console.log("DEBUG: Raw Webhook:", JSON.stringify(body, null, 2));

        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ status: 'ignored' });
        }

        const value = body.entry[0].changes[0].value;
        const incomingPhoneId = value.metadata.phone_number_id; // <--- THIS IS THE KEY
        
        console.log(`DEBUG: Received Message on Phone ID: ${incomingPhoneId}`);

        // 2. Look up the User
        const [users] = await db.query(
            `SELECT user_email FROM social_connect WHERE page_id = ? AND platform = 'whatsapp'`,
            [incomingPhoneId]
        );

        if (!users.length) {
            console.error(`ERROR: No user found for Phone ID [${incomingPhoneId}]. Check 'social_connect' table.`);
            // FALLBACK FOR TESTING: If database lookup fails, default to your email
            // console.log("DEBUG: Using Fallback Email");
            // const ownerEmail = "YOUR_EMAIL@cortexcart.com"; 
            return NextResponse.json({ status: 'ignored_unknown_user' });
        }

        const ownerEmail = users[0].user_email;
        console.log(`DEBUG: Routing message to user: ${ownerEmail}`);

        // 3. Process Message
        const message = value.messages[0];
        const contactPhone = message.from;
        const text = message.text?.body || '[Media/Other]';
        const contactName = value.contacts?.[0]?.profile?.name || 'Unknown';

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

        await db.query(
            `INSERT INTO crm_messages (conversation_id, direction, content, created_at)
             VALUES (?, 'inbound', ?, NOW())`,
            [conversationId, text]
        );

        console.log("DEBUG: Message Saved Successfully");
        return NextResponse.json({ status: 'success' });

    } catch (error) {
        console.error("Webhook Critical Error:", error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}