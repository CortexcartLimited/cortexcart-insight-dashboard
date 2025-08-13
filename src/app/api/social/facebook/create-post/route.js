import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const connection = await db.getConnection();

    try {
        const { content, imageUrl } = await request.json();

        // --- The Refactored Query ---
        // This single JOIN query is more efficient. It finds the active page
        // and retrieves its encrypted access token in one step.
        const sqlQuery = `
            SELECT
                fp.page_access_token_encrypted
            FROM
                facebook_pages_connected AS fpc
            JOIN
                facebook_pages AS fp ON fpc.active_facebook_page_id = fp.page_id AND fpc.user_email = fp.user_email
            WHERE
                fpc.user_email = ?;
        `;
        
        const [results] = await connection.query(sqlQuery, [session.user.email]);

        if (results.length === 0 || !results[0].page_access_token_encrypted) {
            throw new Error('No active Facebook Page with a valid token was found. Please connect a page in your settings.');
        }
        
        // --- The Column Name Fix ---
        // We now correctly reference 'page_access_token_encrypted' from the result.
        const pageAccessToken = decrypt(results[0].page_access_token_encrypted);
        
        // We also need the Page ID for the API endpoint.
        // We can get this from a similar query or assume you might store it in the session/client-side.
        // For simplicity, let's re-add a small query for the active page ID. A more optimized version
        // could pass the pageId from the client request.
        const [sites] = await connection.query(
            'SELECT active_facebook_page_id FROM facebook_pages_connected WHERE user_email = ?',
            [session.user.email]
        );
        const pageId = sites[0]?.active_facebook_page_id;
        if (!pageId) {
             throw new Error('No active Facebook Page has been set.');
        }

        // Prepare the request to the Facebook Graph API
        let endpoint, params;
        if (imageUrl) {
            // Posting a photo with a caption
            endpoint = `https://graph.facebook.com/${pageId}/photos`;
            params = { url: imageUrl, caption: content, access_token: pageAccessToken };
        } else {
            // Posting a simple text update
            endpoint = `https://graph.facebook.com/${pageId}/feed`;
            params = { message: content, access_token: pageAccessToken };
        }
        
        const response = await axios.post(endpoint, params);

        if (response.data.error) {
            // Extract a clearer error message from Facebook's response
            throw new Error(`Facebook API Error: ${response.data.error.message}`);
        }

        return NextResponse.json({ 
            message: 'Successfully posted to Facebook!', 
            postId: response.data.id || response.data.post_id 
        });

    } catch (error) {
        // Log the detailed error on the server for debugging
        console.error('Error in create-post function:', error.message);
        // Return a cleaner, user-friendly error message
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}