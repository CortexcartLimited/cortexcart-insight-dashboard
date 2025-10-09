//../../../../../lib/db
import { db } from '@/lib/db';// Adjust path if necessary
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!siteId) {
    return NextResponse.json({ message: 'Site ID is required' }, { status: 400 });
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
    const query = `
      SELECT 
        DATE(created_at) as date, 
        SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.amount')) AS DECIMAL(10,2))) as total_sales
      FROM events 
      WHERE 
        site_id = ? AND event_name = 'sale' ${dateFilter}
      GROUP BY 
        DATE(created_at) 
      ORDER BY 
        date ASC;
    `;

    const [results] = await db.query(query, queryParams);
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
