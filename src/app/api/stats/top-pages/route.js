import { db } from '@/lib/db';import { NextResponse } from 'next/server';
import { simpleCache } from '@/lib/cache'; // 1. Import the cache

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!siteId) {
    return NextResponse.json({ message: 'Site ID is required' }, { status: 400 });
  }

  // --- 2. Check the Cache First ---
  const cacheKey = `top-pages-${siteId}-${startDate}-${endDate}`;
  const cachedData = simpleCache.get(cacheKey);
  if (cachedData) {
    console.log(`[Cache] HIT for key: ${cacheKey}`);
    return NextResponse.json(cachedData, { status: 200 });
  }
  console.log(`[Cache] MISS for key: ${cacheKey}`);

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
    const query = `
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.path')) as page, 
        COUNT(*) as views
      FROM events
      WHERE 
        site_id = ? AND event_name = 'pageview' ${dateFilter}
      GROUP BY 
        page
      ORDER BY 
        views DESC
      LIMIT 7;
    `;
    
    const [results] = await db.query(query, queryParams);

    // --- 3. Save the Database Result to the Cache ---
    simpleCache.set(cacheKey, results, 600); // Cache for 10 minutes

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('Error fetching top pages:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
