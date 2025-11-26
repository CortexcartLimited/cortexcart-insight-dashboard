import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req) {
    try {
        const { token } = await req.json();

        // 1. Find user with this token
        const [users] = await db.query('SELECT * FROM users WHERE verification_token = ?', [token]);
        
        if (users.length === 0) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 400 });
        }

        const user = users[0];

        // 2. Mark as verified and remove token
        await db.query(
            'UPDATE users SET emailVerified = NOW(), verification_token = NULL WHERE id = ?',
            [user.id]
        );

        return NextResponse.json({ message: 'Verified successfully' }, { status: 200 });

    } catch (error) {
        console.error('Verification Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}