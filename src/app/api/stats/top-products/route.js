import { db } from '@/lib/db';import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { simpleCache } from '@/lib/cache';

// --- FIX: Added the 'request' parameter to the GET function ---
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = session.user.email;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const cacheKey = `top-products-${siteId}-${startDate}-${endDate}`;
    const cachedData = simpleCache.get(cacheKey);
    if (cachedData) {
        return NextResponse.json(cachedData, { status: 200 });
    }

    try {
        let dateFilter = '';
        const queryParams = [siteId];

        if (startDate && endDate) {
            const inclusiveEndDate = new Date(endDate);
            inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
            dateFilter = 'AND created_at BETWEEN ? AND ?';
            queryParams.push(startDate, inclusiveEndDate.toISOString().split('T')[0]);
        }
        
        const query = `
            SELECT
                JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.productName')) as productName,
                JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.path')) as path,
                COUNT(*) as views
            FROM events
            WHERE
                site_id = ?
                AND event_name = 'pageview'
                AND JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.type')) = 'product'
                ${dateFilter}
            GROUP BY
                productName, path
            ORDER BY
                views DESC
            LIMIT 10;
        `;
        
        const [results] = await db.query(query, queryParams);
        simpleCache.set(cacheKey, results, 600);
        return NextResponse.json(results, { status: 200 });

    } catch (error) {
        console.error('Error fetching top products:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
