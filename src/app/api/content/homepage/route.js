import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// This is a public route and does not require authentication.
// It fetches all content needed for the main homepage.
export async function GET() {
    try {
        const [rows] = await db.query('SELECT content_key, content_value FROM cms_content');
        
        // Convert the array of database rows into a single key-value object
        const content = rows.reduce((acc, row) => {
            acc[row.content_key] = row.content_value;
            return acc;
        }, {});

        return NextResponse.json(content, { status: 200 });
    } catch (error) {
        console.error('Error fetching homepage content:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
