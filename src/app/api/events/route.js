import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // We now expect a userEmail instead of a siteId
  const userEmail = searchParams.get('userEmail');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!userEmail) {
    return NextResponse.json({ message: 'User Email is required' }, { status: 400 });
  }

  let dateFilter = '';
  // The first query parameter is now the email address
  const queryParams = [userEmail];

  if (startDate && endDate) {
    const inclusiveEndDate = new Date(endDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
    
    dateFilter = 'AND created_at BETWEEN ? AND ?';
    queryParams.push(startDate, inclusiveEndDate.toISOString().split('T')[0]);
  }

  try {
    const query = `
      SELECT 
        id, 
        event_name, 
        event_data,
        created_at
      FROM events 
      WHERE 
        site_id = ? ${dateFilter} -- This will now check for the email in the site_id column
      ORDER BY 
        created_at DESC
      LIMIT 15;
    `;

    const [results] = await db.query(query, queryParams);
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('Error fetching recent events:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}