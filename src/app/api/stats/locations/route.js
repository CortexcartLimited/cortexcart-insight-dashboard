// src/app/api/stats/locations/route.js
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

  const cacheKey = `locations-${siteId}-${startDate}-${endDate}`;
  // For debugging, let's temporarily bypass the cache to ensure we get fresh data.
  // const cachedData = simpleCache.get(cacheKey);
  // if (cachedData) {
  //   return NextResponse.json(cachedData, { status: 200 });
  // }

  let dateFilter = '';
  const queryParams = [siteId];

  if (startDate && endDate) {
    const inclusiveEndDate = new Date(endDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
    dateFilter = 'AND created_at BETWEEN ? AND ?';
    queryParams.push(startDate, inclusiveEndDate.toISOString().split('T')[0]);
  }

  try {
    // --- This is a simplified and more direct query ---
    const query = `
      SELECT
        CASE
          WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) = 'United Kingdom' THEN 'GBR'
          WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) = 'GB' THEN 'GBR'
          WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) = 'United States' THEN 'USA'
          WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) = 'US' THEN 'USA'
          -- Add more conversions here as needed --
          ELSE JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country'))
        END AS country,
        COUNT(*) as value
      FROM events
      WHERE
        site_id = ?
        AND event_name = 'pageview'
        AND JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) != ''
        AND JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) != 'null'
        ${dateFilter}
      GROUP BY
        country
      ORDER BY
        value DESC;
    `;
    
    const [results] = await db.query(query, queryParams);
    
    // --- THIS IS THE CRITICAL DEBUGGING STEP ---
    // This will print the database results to your server's PM2 log.
    console.log("Database results for locations:", results);
    // -----------------------------------------

    simpleCache.set(cacheKey, results, 600);
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('Error fetching location data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}