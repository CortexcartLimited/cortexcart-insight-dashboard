// File: src/app/api/social/facebook/pages/route.js
export const dynamic = 'force-dynamic';
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
            return NextResponse.json([]); // Return empty array if no token
        }

        if (!connections.length || !connections[0].access_token_encrypted) {
            //throw new Error('Facebook access token not found.');
            return NextResponse.json([], { status: 200 });
        }

        const accessToken = decrypt(connections[0].access_token_encrypted);
        // Added this check to make the check for the access token more robust, we check the key is decrypted before using it!
               if (!accessToken) {
        // This means decryption failed.
            throw new Error('Failed to decrypt access token. Please check server configuration.');
        }

        const url = `https://graph.facebook.com/me/accounts?access_token=${accessToken}&fields=id,name,picture`;
        
        const fbResponse = await fetch(url);
        const data = await fbResponse.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        // ❗️ IMPORTANT: Map the data to match the frontend's expected format
        const formattedPages = (data.data || []).map(page => ({
            page_id: page.id,
            name: page.name,
            picture: page.picture,
            access_token: page.page_access_authorization_token,
        }));

        return NextResponse.json(formattedPages, { status: 200 });

    } catch (error) {
        console.error('--- [DEBUG] Error fetching Facebook pages ---:', error);
        return NextResponse.json({ message: `Failed to fetch pages: ${error.message}` }, { status: 500 });
    }
}