import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

// GET: Fetch existing demographic settings for the logged-in user
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT age_range, sex, country FROM social_demographics WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length > 0) {
            return NextResponse.json(rows[0]);
        } else {
            // Return default values if no settings are found
            return NextResponse.json({ age_range: '', sex: '', country: '' });
        }
    } catch (error) {
        console.error('Error fetching demographics:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// POST: Save or update demographic settings for the logged-in user
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { ageRange, sex, country } = await req.json();

        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both new and existing records
        const query = `
            INSERT INTO social_demographics (user_email, age_range, sex, country)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                age_range = VALUES(age_range),
                sex = VALUES(sex),
                country = VALUES(country);
        `;
        
        await db.query(query, [session.user.email, ageRange, sex, country]);

        return NextResponse.json({ message: 'Demographic preferences saved successfully!' }, { status: 200 });

    } catch (error) {
        console.error('Error saving demographic preferences:', error);
        return NextResponse.json({ message: 'Failed to save demographic preferences.', error: error.message }, { status: 500 });
    }
}