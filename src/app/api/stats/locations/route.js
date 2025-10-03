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
              const [rows] = await db.query(
            `SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) as country_code, 
                COUNT(*) as value 
             FROM events 
             WHERE 
                site_id = ? AND 
                event_name = 'pageview' AND 
                JSON_EXTRACT(event_data, '$.country') IS NOT NULL
             GROUP BY country_code 
             ORDER BY value DESC`,
            [session.user.site_id]
        );

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