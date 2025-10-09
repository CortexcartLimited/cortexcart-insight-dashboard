import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = params;
    if (!platform) {
        return NextResponse.json({ error: 'Platform not specified' }, { status: 400 });
    }

    try {
        if (platform === 'facebook') {
            // --- FIX: Delete all records associated with Facebook ---
            // This is crucial because a user can have both a 'facebook' (for the user profile)
            // and a 'facebook-page' (for the connected page) record.
            await db.query(
                "DELETE FROM social_connect WHERE user_email = ? AND platform IN ('facebook', 'facebook-page')",
                [session.user.email]
            );
        } else {
            // For other platforms, the original logic is fine
            await db.query(
                'DELETE FROM social_connect WHERE user_email = ? AND platform = ?',
                [session.user.email, platform]
            );
        }

        return NextResponse.json({ message: 'Successfully disconnected.' });
    } catch (error) {
        console.error(`Error disconnecting from ${platform}:`, error);
        return NextResponse.json({ error: 'Failed to disconnect.' }, { status: 500 });
    }
}