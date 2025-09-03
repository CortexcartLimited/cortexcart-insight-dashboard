import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [connectRows] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'facebook']
        );

        if (connectRows.length === 0 || !connectRows[0].access_token_encrypted) {
            return NextResponse.json([]); // Return empty array if not connected
        }
        
        const accessToken = decrypt(connectRows[0].access_token_encrypted);
        if (!accessToken) {
             return NextResponse.json({ error: 'Invalid access token' }, { status: 400 });
        }

        // ✅ FIX: Added 'picture' to the fields being requested from Facebook
        const response = await axios.get(`https://graph.facebook.com/me/accounts`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,access_token,picture'
            }
        });

        const pages = response.data.data;

        if (pages && pages.length > 0) {
            // ✅ FIX: Correctly maps the picture URL and saves it to the database
            const pageValues = pages.map(page => [
                session.user.email, 
                page.id, 
                page.name, 
                page.access_token,
                page.picture?.data?.url || null // Safely access the picture URL
            ]);
            
            const query = `
                INSERT INTO facebook_pages (user_email, page_id, name, access_token, profile_picture) 
                VALUES ? 
                ON DUPLICATE KEY UPDATE 
                name = VALUES(name), 
                access_token = VALUES(access_token), 
                profile_picture = VALUES(profile_picture)
            `;
            await db.query(query, [pageValues]);
        }
        
        // Return the pages we just fetched and saved
        const [pageRows] = await db.query('SELECT page_id, name, profile_picture FROM facebook_pages WHERE user_email = ?', [session.user.email]);
        return NextResponse.json(pageRows);

    } catch (error) {
        console.error('Error fetching Facebook pages:', error.response ? error.response.data : error.message);
        return NextResponse.json({ error: 'Failed to fetch Facebook pages' }, { status: 500 });
    }
}