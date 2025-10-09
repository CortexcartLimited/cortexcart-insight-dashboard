// src/app/api/social/credentials/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/crypto'; // Import our new encryption function

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { platform, apiKey, apiSecret } = await request.json();
    if (!platform || !apiKey || !apiSecret) {
        return NextResponse.json({ message: 'Platform, API Key, and API Secret are required' }, { status: 400 });
    }

    try {
        // Encrypt the credentials before saving
        const encryptedApiKey = encrypt(apiKey);
        const encryptedApiSecret = encrypt(apiSecret);

        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both new and existing connections
        const query = `
            INSERT INTO social_connections (user_email, platform, api_key_encrypted, api_secret_encrypted)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                api_key_encrypted = VALUES(api_key_encrypted), 
                api_secret_encrypted = VALUES(api_secret_encrypted);
        `;
        
        await db.query(query, [session.user.email, platform, encryptedApiKey, encryptedApiSecret]);

        return NextResponse.json({ message: `${platform} credentials saved successfully.` }, { status: 200 });

    } catch (error) {
        console.error('Error saving credentials:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
