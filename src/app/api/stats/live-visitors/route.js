import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');

  if (!siteId) {
    return NextResponse.json({ message: 'Site ID is required' }, { status: 400 });
  }

  try {
    // This query counts the number of distinct IP addresses that have sent a 
    // pageview event in the last 5 minutes. This gives a "live" feel.
    const query = `
      SELECT
        COUNT(DISTINCT JSON_EXTRACT(event_data, '$.ip')) as visitor_count
      FROM events
      WHERE
        site_id = ? 
        AND event_name = 'pageview'
        AND created_at >= NOW() - INTERVAL 5 MINUTE;
    `;
    
    const [[result]] = await db.query(query, [siteId]);
    return NextResponse.json({ liveVisitors: result.visitor_count || 0 }, { status: 200 });

  } catch (error) {
    // Added a check to ensure connection to db is retried if connection is lost due to being idle!
       if (error.code === 'ECONNRESET') {
        console.warn('Database connection was reset. Retrying once...');
        try {
            // Retry the query one more time
            const visitorCount = await getVisitorCount(siteId);
            return NextResponse.json({ liveVisitors: visitorCount }, { status: 200 });
        } catch (retryError) {
            console.error('Error on retry fetching live visitor count:', retryError);
            return NextResponse.json({ message: 'Internal Server Error after retry' }, { status: 500 });
        }
    }
    console.error('Error fetching live visitor count:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
