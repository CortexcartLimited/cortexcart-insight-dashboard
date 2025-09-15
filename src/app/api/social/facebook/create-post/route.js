import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import axios from 'axios';
import FormData from 'form-data'; // Import FormData

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const incomingFormData = await req.formData();
        const content = incomingFormData.get('content');
        const imageFile = incomingFormData.get('image'); 

        const [userRows] = await db.query(
            `SELECT sc.page_id, sc.page_access_token_encrypted 
             FROM social_connect sc
             WHERE sc.user_email = ? AND sc.platform = 'facebook' AND sc.active_facebook_page_id IS NOT NULL`,
            [session.user.email]
        );

        if (userRows.length === 0 || !userRows[0].page_id || !userRows[0].page_access_token_encrypted) {
            return NextResponse.json({ error: 'Active Facebook Page not connected or configured.' }, { status: 400 });
        }

        const pageId = userRows[0].page_id;
        const pageAccessToken = decrypt(userRows[0].page_access_token_encrypted);
        
        let response;
        if (imageFile && imageFile.size > 0) {
            // --- FIX for Image Post ---
            const form = new FormData();
            form.append('caption', content);
            form.append('access_token', pageAccessToken);
            
            // Convert the file to a buffer and append it
            const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
            form.append('source', imageBuffer, {
                filename: imageFile.name,
                contentType: imageFile.type,
            });

            response = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, form, {
                headers: form.getHeaders(),
            });

        } else {
            // Logic for text-only post
            response = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                message: content,
                access_token: pageAccessToken,
            });
        }

        const postId = response.data.id || response.data.post_id;
        return NextResponse.json({ success: true, postId }, { status: 200 });

    } catch (error) {
        console.error("CRITICAL Error posting to Facebook:");
        if (error.response) {
            console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
        
        const errorDetails = error.response ? error.response.data.error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: 'Failed to post to Facebook.', details: errorDetails }, { status: 500 });
    }
}