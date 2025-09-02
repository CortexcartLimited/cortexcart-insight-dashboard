import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'facebook']
        );

        if (rows.length === 0 || !rows[0].access_token_encrypted) {
            return NextResponse.json({ pages: [] });
        }

        let accessToken;
        try {
            const decryptedToken = decrypt(rows[0].access_token_encrypted);
            if (!decryptedToken) {
                // Handles case where decryption returns null but doesn't throw
                throw new Error("Decrypted token is null or empty.");
            }
            accessToken = decryptedToken;
        } catch (e) {
            console.error("Failed to decrypt Facebook token for user:", session.user.email, e.message);
            // If token is corrupt, we can't fetch pages. Return empty array gracefully.
            return NextResponse.json({ pages: [] });
        }

        const response = await axios.get(`https://graph.facebook.com/me/accounts`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,access_token'
            }
        });

        const pages = response.data.data;
        // Your logic to store pages in the DB can go here if needed.

        return NextResponse.json({ pages });
    } catch (error) {
        console.error('Error fetching Facebook pages:', error.response ? error.response.data : error.message);
        return NextResponse.json({ error: 'Failed to fetch Facebook pages' }, { status: 500 });
    }
}