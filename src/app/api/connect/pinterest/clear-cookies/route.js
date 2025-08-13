import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
    try {
        cookies().delete('pinterest_oauth_state');
        cookies().delete('pinterest_oauth_code_verifier');
        return NextResponse.json({ message: 'Pinterest cookies cleared' }, { status: 200 });
    } catch (error) {
        console.error("Error clearing Pinterest cookies:", error);
        return NextResponse.json({ message: 'Failed to clear cookies' }, { status: 500 });
    }
}