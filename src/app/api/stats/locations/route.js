import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!siteId || !startDate || !endDate) {
        return NextResponse.json({ message: 'Site ID and date range are required' }, { status: 400 });
    }

    try {
        const query = `
            SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) AS country,
                COUNT(*) AS visitor_count
            FROM 
                events
            WHERE 
                event_name = 'pageview' AND
                site_id = ? AND
                created_at BETWEEN ? AND ?
            GROUP BY 
                country
            HAVING
                country IS NOT NULL AND country != ''
            ORDER BY 
                visitor_count DESC
            LIMIT 7;
        `;

        const queryParams = [siteId, startDate, `${endDate} 23:59:59`];
        const [rows] = await db.query(query, queryParams);

        const formattedData = rows.map(row => ({
            name: row.country || 'Unknown',
            value: parseInt(row.visitor_count, 10),
        }));

        return NextResponse.json(formattedData);

    } catch (error) {
        console.error("Error fetching visitor locations:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}