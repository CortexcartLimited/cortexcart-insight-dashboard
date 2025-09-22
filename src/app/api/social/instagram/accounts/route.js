import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [accounts] = await db.query(
            'SELECT page_id, instagram_id, username, profile_picture_url, is_active FROM instagram_accounts WHERE user_email = ?',
            [session.user.email]
        );
        
        // --- THIS IS THE KEY ---
        // Ensure we always return an array, even if 'accounts' is null or undefined
        return NextResponse.json(accounts || []);

    } catch (error) {
        console.error('Error fetching Instagram accounts:', error);
        // Also return an empty array on error to prevent the frontend from crashing
        return NextResponse.json([], { status: 500 });
    }
}