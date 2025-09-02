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
            [session.user.email, 'pinterest']
        );

        if (rows.length === 0 || !rows[0].access_token_encrypted) {
            return NextResponse.json({ boards: [] });
        }

        let accessToken;
        try {
            const decryptedToken = decrypt(rows[0].access_token_encrypted);
            if (!decryptedToken) {
                throw new Error("Decrypted token is null or empty.");
            }
            accessToken = decryptedToken;
        } catch (e) {
            console.error("Failed to decrypt Pinterest token for user:", session.user.email, e.message);
            // If token is corrupt, we can't fetch boards. Return empty array gracefully.
            return NextResponse.json({ boards: [] });
        }

        const response = await axios.get('https://api.pinterest.com/v5/boards', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const boards = response.data.items;
        return NextResponse.json({ boards });

    } catch (error) {
        console.error('Error fetching Pinterest boards:', error.response ? error.response.data : error.message);
        return NextResponse.json({ error: 'Failed to fetch Pinterest boards' }, { status: 500 });
    }
}