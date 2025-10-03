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
        // Corrected Query: Extracts 'country' from the JSON in 'event_data'
        // and filters by 'event_name'.
        const query = `
            SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) AS country,
                COUNT(*) AS visitor_count
            FROM 
                events
            WHERE 
                event_name = 'page view' AND
                created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
            GROUP BY 
                country
            HAVING
                country IS NOT NULL AND country != ''
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