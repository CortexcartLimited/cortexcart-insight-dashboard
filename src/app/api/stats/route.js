import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { simpleCache } from '@/lib/cache';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!siteId) {
    return NextResponse.json({ message: 'Site ID is required' }, { status: 400 });
  }

  const cacheKey = `stats-${siteId}-${startDate}-${endDate}`;
  const cachedData = simpleCache.get(cacheKey);

  if (cachedData) {
    return NextResponse.json(cachedData, { status: 200 });
  }

  let dateFilter = '';
  const queryParams = [siteId];

  if (startDate && endDate) {
    const inclusiveEndDate = new Date(endDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
    dateFilter = 'AND created_at BETWEEN ? AND ?';
    queryParams.push(startDate, inclusiveEndDate.toISOString().split('T')[0]);
  }

  try {
    // --- THIS IS THE FIX ---
    // The ${dateFilter} variable has been added to all three queries.
    const pageviewsQuery = `SELECT COUNT(*) as count FROM events WHERE site_id = ? AND event_name = 'pageview' ${dateFilter};`;
    const salesQuery = `SELECT COUNT(*) as count FROM events WHERE site_id = ? AND event_name = 'sale' ${dateFilter};`;
    const revenueQuery = `SELECT SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.amount')) AS DECIMAL(10,2))) as total FROM events WHERE site_id = ? AND event_name = 'sale' ${dateFilter};`;

    const [[pageviewsResult], [salesResult], [revenueResult]] = await Promise.all([
        db.query(pageviewsQuery, queryParams),
        db.query(salesQuery, queryParams),
        db.query(revenueQuery, queryParams)
    ]);

    const statsData = {
      pageviews: pageviewsResult[0]?.count || 0,
      sales: salesResult[0]?.count || 0,
      totalRevenue: revenueResult[0]?.total || 0,
    };

    simpleCache.set(cacheKey, statsData, 600); // Cache for 10 minutes

    return NextResponse.json(statsData, { status: 200 });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
