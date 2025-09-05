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
        // 1. Get the User's Facebook Access Token
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

        // 2. Fetch the latest pages list from Facebook's API
        const response = await axios.get(`https://graph.facebook.com/me/accounts`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,access_token,picture' // Ensure we ask for the picture
            }
        });

        const pagesFromFacebook = response.data.data;

        // 3. Save the latest page info into our database
        if (pagesFromFacebook && pagesFromFacebook.length > 0) {
            const pageValues = pagesFromFacebook.map(page => [
                session.user.email, 
                page.id, 
                page.page_name, 
                page.access_token,
                page.picture_url?.data?.url || null
            ]);
            
            const query = `
                INSERT INTO facebook_pages (user_email, page_id, page_name, page_access_token_encrypted, picture_url) 
                VALUES ? 
                ON DUPLICATE KEY UPDATE 
                page_name = VALUES(page_name), 
                page_access_token_encrypted = VALUES(page_access_token_encrypted), 
                picture_url = VALUES(picture_url)
            `;
            await db.query(query, [pageValues]);
        }
        
        // 4. ✅ FIX: Directly read from the database and send that as the response
        // This guarantees that what's in the DB is what the frontend receives.
        const [pageRows] = await db.query(
            'SELECT page_id, page_name, profile_url FROM facebook_pages WHERE user_email = ?', 
            [session.user.email]
        );

        return NextResponse.json(pageRows);

    } catch (error) {
        console.error('Error fetching Facebook pages:', error.response ? error.response.data : error.message);
        return NextResponse.json({ error: 'Failed to fetch Facebook pages' }, { status: 500 });
    }
}