import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("\n--- [DEBUG] Fetching Instagram Accounts ---");
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

        const url = `https://graph.facebook.com/me/accounts?fields=name,picture,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('--- [DEBUG] Raw response from Facebook Graph API ---:', JSON.stringify(data, null, 2));

        if (data.error) {
            console.error("--- [DEBUG] Facebook Graph API Error ---:", data.error);
            throw new Error(data.error.message);
        }
        
        const instagramAccounts = (data.data || [])
            .filter(page => page.instagram_business_account)
            .map(page => page.instagram_business_account);

        console.log(`--- [DEBUG] Found ${instagramAccounts.length} linked Instagram accounts.`);
        return NextResponse.json(instagramAccounts);

    } catch (error) {
        console.error('--- [DEBUG] Error in /api/social/instagram/accounts route ---:', error);
        return NextResponse.json({ message: `Failed to fetch accounts: ${error.message}` }, { status: 500 });
    }
}