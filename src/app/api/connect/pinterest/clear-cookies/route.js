// src/app/api/connect/pinterest/clear-cookies/route.js

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // --- THE FIX: Added await to the cookies().delete() calls ---
        await cookies().delete('pinterest_oauth_state');
        await cookies().delete('pinterest_oauth_code_verifier');
        return NextResponse.json({ message: 'Pinterest cookies cleared' }, { status: 200 });
    } catch (error) {
        console.error("Error clearing Pinterest cookies:", error);
        return NextResponse.json({ error: 'Failed to clear cookies' }, { status: 500 });
    }
}