import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    const intervalMap = {
        '24h': '1 DAY',
        '7d': '7 DAY',
        '30d': '30 DAY',
        '90d': '90 DAY',
    };
    const interval = intervalMap[period] || '7 DAY';

    try {
        // Corrected Query: Using the 'events' table and its columns
        const query = `
            SELECT 
                country, 
                COUNT(*) as visitor_count
            FROM 
                events  -- Corrected table name
            WHERE 
                event_type = 'pageview' AND  -- Filter for only pageview events
                timestamp >= DATE_SUB(NOW(), INTERVAL ${interval})
            GROUP BY 
                country
            ORDER BY 
                visitor_count DESC
            LIMIT 7;
        `;

        const [rows] = await db.query(query);

        const formattedData = rows.map(row => ({
            name: row.country || 'Unknown',
            value: parseInt(row.visitor_count, 10),
        }));

        return NextResponse.json(formattedData);

    } catch (error) {
        console.error("Error fetching visitor locations:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}