import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT access_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'facebook']
        );

        if (rows.length === 0 || !rows[0].access_token_encrypted) {
            return NextResponse.json({ error: 'Facebook connection not found.' }, { status: 404 });
        }

        const accessToken = decrypt(rows[0].access_token_encrypted);
        
        // Request the 'tasks' field which is a more reliable way to get permissions
        const response = await fetch(`https://graph.facebook.com/me/accounts?fields=name,access_token,tasks,instagram_business_account{name,username}&access_token=${accessToken}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Facebook Graph API error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch pages from Facebook.', details: errorData.error.message }, { status: response.status });
        }

        const data = await response.json();
        
        // --- FINAL FIX: A more reliable way to filter for pages you can post to ---
        let pagesWithPermissions = [];
        if (data && Array.isArray(data.data)) {
            pagesWithPermissions = data.data.filter(page => 
                // Instead of 'perms', we check the 'tasks' field for 'CREATE_CONTENT'
                page && Array.isArray(page.tasks) && page.tasks.includes('CREATE_CONTENT')
            );
        }

        return NextResponse.json(pagesWithPermissions);

    } catch (error) {
        console.error('Error fetching Facebook pages:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}