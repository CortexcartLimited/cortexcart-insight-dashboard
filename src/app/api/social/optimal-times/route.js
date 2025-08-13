import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const connection = await db.getConnection();
        
        // 1. Get the user's saved demographic settings
        const [demographics] = await connection.query(
            'SELECT age_range, sex, country FROM social_demographics WHERE user_email = ?',
            [session.user.email]
        );

        if (demographics.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'No demographics set.' }, { status: 404 });
        }

        const { age_range, sex, country } = demographics[0];

        // 2. Find the optimal times from the new table based on those settings
        const [optimalTimes] = await connection.query(
            'SELECT platform, optimal_day, optimal_times FROM social_optimal_times WHERE age_range = ? AND sex = ? AND country = ?',
            [age_range, sex, country]
        );

        if (optimalTimes.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'No optimal times found for the specified demographics.' }, { status: 404 });
        }

        connection.release();
        return NextResponse.json(optimalTimes);

    } catch (error) {
        console.error('Error fetching optimal times:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}