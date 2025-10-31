// src/app/api/dashboard/data/[dataSource]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// We must use the nodejs runtime
export const runtime = 'nodejs';

/**
 * This is our "smart" data-fetching API.
 * It receives a dataSource name and returns the corresponding data.
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { dataSource } = params; // e.g., "ga4_total_users"

    // In the future, we will fetch the user's connected GA4 ID, etc.
    // const [userRows] = await db.query(
    //   'SELECT ga4_property_id FROM sites WHERE user_email = ?',
    //   [session.user.email]
    // );
    // const ga4PropertyId = userRows[0]?.ga4_property_id;

    // --- Main Data-Fetching Logic ---
    // This 'switch' block will grow as you add more widgets
    switch (dataSource) {
      
      // --- Case 1: Stat Card ---
      case 'ga4_total_users': {
        // --- STUBBED DATA ---
        // In the future, you'd make a Google Analytics API call here.
        // For now, just return a fake JSON object.
        const fakeData = {
          title: 'Total Users', // Our StatCardWidget.js expects this
          value: '12,789',
          change: '+12.5%',
        };
        return NextResponse.json(fakeData, { status: 200 });
      }

      // --- Case 2: Line Chart ---
      case 'ga4_sessions': {
        // --- STUBBED DATA ---
        // In the future, you'd return a real chart data object.
        const fakeData = {
          title: 'Sessions (Last 30 Days)', // Our LineChartWidget.js expects this
          // The real data would be a list of dates and values
          // data: [ { date: '...', value: 123 }, ... ]
        };
        return NextResponse.json(fakeData, { status: 200 });
      }

      // --- Default Case ---
      default:
        return NextResponse.json(
          { message: `Unknown data source: ${dataSource}` },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error(`Error fetching data for ${params.dataSource}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}