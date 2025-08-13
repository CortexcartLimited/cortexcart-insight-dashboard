// src/app/api/stats/device-types/route.js
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

  const cacheKey = `device-types-${siteId}-${startDate}-${endDate}`;
  const cachedData = simpleCache.get(cacheKey);

  if (cachedData) {
    console.log(`[Cache] HIT for key: ${cacheKey}`);
    return NextResponse.json(cachedData, { status: 200 });
  }

  console.log(`[Cache] MISS for key: ${cacheKey}`);

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
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.device')), 'unknown') as device, 
        COUNT(*) as views
      FROM events
      WHERE
        site_id = ? 
        AND event_name = 'pageview'
        ${dateFilter}
      GROUP BY 
        device;
    `;
    
    const [results] = await db.query(query, queryParams);
    
    // --- THIS IS THE FIX ---
    // Use the 'results' variable which contains the data from the database
    simpleCache.set(cacheKey, results, 600);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error fetching device data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
