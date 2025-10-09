import { db } from '@/lib/db';// Make sure this alias is correct for your setup
import { NextResponse } from 'next/server';
import { simpleCache } from '@/lib/cache'; // 1. Import the cache

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!siteId) {
    return NextResponse.json({ message: 'Site ID is required' }, { status: 400 });
  }
const cacheKey = `top-referrers-${siteId}-${startDate}-${endDate}`;
  const cachedData = simpleCache.get(cacheKey);
  if (cachedData) {
    return NextResponse.json(cachedData, { status: 200 });
  }
  // Build the WHERE clause for the date range
  let dateFilter = '';
  const queryParams = [siteId];

  if (startDate && endDate) {
    const inclusiveEndDate = new Date(endDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);

    dateFilter = 'AND created_at BETWEEN ? AND ?';
    queryParams.push(startDate, inclusiveEndDate.toISOString().split('T')[0]);
  }

  try {
    // This query counts pageviews, groups them by the referrer,
    // and returns the top 7 sources.
    const query = `
      SELECT 
        -- Use COALESCE to group empty/null referrers as '(Direct)'
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.referrer')), '(Direct)') as referrer,
        COUNT(*) as views
      FROM events
      WHERE
        site_id = ? AND event_name = 'pageview' ${dateFilter}
      GROUP BY 
        referrer
      ORDER BY 
        views DESC
      LIMIT 7;
    `;
    
    const [results] = await db.query(query, queryParams);

	simpleCache.set(cacheKey, results, 600); // Cache for 10 minutes

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('Error fetching top referrers:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
