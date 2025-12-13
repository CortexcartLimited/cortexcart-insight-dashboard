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
    // 1. Read the text ONCE
    const rawBody = await req.text();
    
    // 2. Log it
    console.log("------------------------------------------------");
    console.log("🔥 INCOMING HIT DETECTED 🔥");
    // console.log("RAW BODY:", rawBody); // Uncomment if you need raw logs again
    console.log("------------------------------------------------");

    if (!rawBody) return NextResponse.json({ status: 'empty' });

    // 3. Parse the text ONCE
    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return NextResponse.json({ status: 'invalid_json' }, { status: 400 });
    }

    try {
        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ status: 'ignored_not_message' });
        }

        const value = body.entry[0].changes[0].value;
        const incomingPhoneId = value.metadata.phone_number_id; 
        
        console.log(`DEBUG: Received Message on Phone ID: ${incomingPhoneId}`);

        // 4. Look up the User (Owner of the Virtual Number)
        const [users] = await db.query(
            `SELECT user_email FROM social_connect WHERE page_id = ? AND platform = 'whatsapp'`,
            [incomingPhoneId]
        );

        if (!users || !users.length) {
            console.error(`ERROR: No user found for Phone ID [${incomingPhoneId}].`);
            return NextResponse.json({ status: 'ignored_unknown_user' });
        }

        const ownerEmail = users[0].user_email;
        
        // 5. Process Message Data
        const message = value.messages[0];
        const contactPhone = message.from; // This is what Meta sends (e.g., "447474711501")
        const text = message.text?.body || '[Media/Other]';
        const contactName = value.contacts?.[0]?.profile?.name || 'Unknown';

        console.log(`DEBUG: Processing for Owner: [${ownerEmail}]`);
        console.log(`DEBUG: Sender Phone (Meta): [${contactPhone}]`);

        // 6. Find Existing Conversation
        // PROBLEM AREA: This usually fails because DB has "+44..." but Meta sends "44..."
        let [conv] = await db.query(
            `SELECT id, external_id FROM crm_conversations 
             WHERE user_email = ? AND (external_id = ? OR external_id = ?)`,
            [ownerEmail, contactPhone, `+${contactPhone}`] 
            // ^ IMPROVEMENT: We now check BOTH "447..." and "+447..." to catch mismatched formats
        );

        let conversationId;

        if (conv && conv.length > 0) {
            // MATCH FOUND: Attach to existing conversation
            conversationId = conv[0].id;
            console.log(`✅ FOUND Existing Conversation ID: ${conversationId} (Matched: ${conv[0].external_id})`);

            await db.query(
                `UPDATE crm_conversations 
                 SET last_message = ?, updated_at = NOW(), unread_count = unread_count + 1, status = 'open' 
                 WHERE id = ?`,
                [text, conversationId]
            );
        } else {
            // NO MATCH: Create New
            console.log(`⚠️ NO MATCH FOUND. Creating NEW Conversation.`);
            console.log(`   -> Checked DB for user: ${ownerEmail}`);
            console.log(`   -> Checked DB for external_id: ${contactPhone} OR +${contactPhone}`);
            
            const [newConv] = await db.query(
                `INSERT INTO crm_conversations 
                 (user_email, platform, external_id, contact_name, last_message, unread_count, updated_at)
                 VALUES (?, 'whatsapp', ?, ?, ?, 1, NOW())`,
                [ownerEmail, contactPhone, contactName, text]
            );
            conversationId = newConv.insertId;
        }

        // 7. Save the Message
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