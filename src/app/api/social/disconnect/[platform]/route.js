import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { platform } = params;
    const userEmail = session.user.email;

    if (!platform) {
        return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    try {
        await db.query('START TRANSACTION');

        await db.query(
            'DELETE FROM social_connect WHERE user_email = ? AND platform = ?',
            [userEmail, platform]
        );

        if (platform === 'facebook') {
            await db.query('DELETE FROM instagram_accounts WHERE user_email = ?', [userEmail]);
            await db.query('DELETE FROM facebook_pages WHERE user_email = ?', [userEmail]);
        }
        
        await db.query('COMMIT');
        return NextResponse.json({ success: true, message: `${platform} disconnected.` });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error(`Error disconnecting ${platform}:`, error);
        return NextResponse.json({ error: `Failed to disconnect ${platform}.` }, { status: 500 });
    }
}