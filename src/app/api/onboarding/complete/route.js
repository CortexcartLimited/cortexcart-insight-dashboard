import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const formData = await request.json();
        const { fullName, address, postalCode, siteName, siteUrl } = formData;
        
        // You may want to add validation here

        // Update the user's site information and mark onboarding as complete
        await db.query(
            `UPDATE sites 
             SET site_name = ?, site_url = ?, full_name = ?, address = ?, postal_code = ?, onboarding_completed = TRUE 
             WHERE user_email = ?`,
            [siteName, siteUrl, fullName, address, postalCode, session.user.email]
        );

        // Note: You may need to add columns like 'owner_name', 'address', 'postal_code' to your 'sites' table
        // Example: ALTER TABLE sites ADD COLUMN owner_name VARCHAR(255), ADD COLUMN address TEXT, ADD COLUMN postal_code VARCHAR(20);

        return NextResponse.json({ message: 'Onboarding completed successfully.' });

    } catch (error) {
        console.error("Onboarding completion error:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}