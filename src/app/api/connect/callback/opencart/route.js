// src/app/api/connect/callback/opencart/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { db } from '@/lib/db'; // Your database utility

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { state: receivedState } = await req.json();
    const cookieStore = cookies();
    const stateCookie = cookieStore.get('opencart_oauth_state');

    if (!stateCookie || !receivedState) {
        return NextResponse.json({ error: 'State cookie not found or state not received.' }, { status: 400 });
    }

    const { state: storedState, returnUrl } = JSON.parse(stateCookie.value);

    // Security Check: Ensure the state matches
    if (receivedState !== storedState) {
        return NextResponse.json({ error: 'State mismatch. CSRF attack detected.' }, { status: 403 });
    }

    try {
        // --- Database Logic ---
        // Save the connection to your database.
        // You'll likely want to store the OpenCart store URL (which is 'returnUrl')
        // to identify the specific store.
        const query = `
            INSERT INTO social_connect (user_email, platform, account_identifier, status)
            VALUES (?, ?, ?, 'connected')
            ON DUPLICATE KEY UPDATE 
                account_identifier = VALUES(account_identifier),
                status = 'connected';
        `;
        // We use the base URL of the returnUrl as the unique identifier for the store
        const storeIdentifier = new URL(returnUrl).origin;
        await db.query(query, [session.user.email, 'opencart', storeIdentifier]);
        
        // --- End Database Logic ---

        // Clear the state cookie now that it has been used
        cookieStore.set('opencart_oauth_state', '', { maxAge: -1 });

        // Success! Send the return URL back to the client-side confirmation page.
        return NextResponse.json({ success: true, returnUrl: returnUrl });

    } catch (error) {
        console.error("OpenCart connection error:", error);
        return NextResponse.json({ error: 'Failed to save the OpenCart connection.' }, { status: 500 });
    }
}