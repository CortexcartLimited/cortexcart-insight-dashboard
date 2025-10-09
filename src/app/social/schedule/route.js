import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Fetch all scheduled posts for the user
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        const [posts] = await db.query(
            "SELECT * FROM scheduled_posts WHERE user_email = ? AND status = 'scheduled' ORDER BY scheduled_at ASC",
            [userEmail]
        );
        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        console.error("Error fetching scheduled posts:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// POST: Save a new post to the schedule
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        const { platform, content, hashtags, scheduledAt } = await request.json();

        if (!platform || !content || !scheduledAt) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }
        
        // Basic validation for date
        if (new Date(scheduledAt) < new Date()) {
            return NextResponse.json({ message: 'Scheduled time cannot be in the past.' }, { status: 400 });
        }

        const query = `
            INSERT INTO scheduled_posts (user_email, platform, content, hashtags, scheduled_at)
            VALUES (?, ?, ?, ?, ?);
        `;
        await db.query(query, [userEmail, platform, content, JSON.stringify(hashtags), scheduledAt]);
        
        return NextResponse.json({ message: 'Post scheduled successfully!' }, { status: 201 });

    } catch (error) {
        console.error('Error scheduling post:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}