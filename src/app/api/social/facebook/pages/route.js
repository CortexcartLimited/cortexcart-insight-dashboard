import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("\n--- [DEBUG] Fetching Facebook Pages ---");
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [connections] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'facebook']
        );

        if (!connections.length || !connections[0].access_token_encrypted) {
            return NextResponse.json([]);
        }

        const accessToken = decrypt(connections[0].access_token_encrypted);
        if (!accessToken) {
            throw new Error('Failed to decrypt access token.');
        }

        const url = `https://graph.facebook.com/me/accounts?access_token=${accessToken}&fields=id,name,picture`;
        const fbResponse = await fetch(url);
        const data = await fbResponse.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const formattedPages = (data.data || []).map(page => ({
            page_id: page.id,
            name: page.name,
            picture: page.picture,
        }));

        return NextResponse.json(formattedPages);

    } catch (error) {
        console.error('--- [DEBUG] Error fetching Facebook pages ---:', error);
        return NextResponse.json({ message: `Failed to fetch pages: ${error.message}` }, { status: 500 });
    }
}