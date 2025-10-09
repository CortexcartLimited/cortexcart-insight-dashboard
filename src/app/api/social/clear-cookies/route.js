import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
    try {
        cookies().delete('x_oauth_code_verifier');
        cookies().delete('x_oauth_state');
        return NextResponse.json({ message: 'Cookies cleared' }, { status: 200 });
    } catch (error) {
        console.error("Error clearing cookies:", error);
        return NextResponse.json({ message: 'Failed to clear cookies' }, { status: 500 });
    }
}