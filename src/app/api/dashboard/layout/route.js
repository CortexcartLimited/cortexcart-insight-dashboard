// src/app/api/dashboard/layout/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// This is the CRITICAL part for new users.
// If a user has no saved layout, we'll give them this default one.
// We can change this later, but it gives us a starting point.
const DEFAULT_DASHBOARD = {
  layout: [
    // We'll define a default 2-widget layout
    { i: 'a', x: 0, y: 0, w: 6, h: 2 }, // 'i' is the ID, 'x/y' are coordinates, 'w/h' are width/height
    { i: 'b', x: 6, y: 0, w: 6, h: 2 }
  ],
  widgets: [
    { i: 'a', component: 'StatCard', dataSource: 'ga4_total_users' },
    { i: 'b', component: 'LineChart', dataSource: 'ga4_sessions' }
  ]
};

// We MUST use the nodejs runtime because we're accessing the database
export const runtime = 'nodejs';

/**
 * GET - Fetches the user's saved dashboard layout.
 * If no layout is found, returns a default layout.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const [userRows] = await db.query(
      'SELECT dashboard_layout FROM sites WHERE user_email = ?',
      [session.user.email]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ message: 'User site not found' }, { status: 404 });
    }

    let layout = userRows[0].dashboard_layout;

    // If the user has no layout saved (NULL), return the default
    if (!layout) {
      return NextResponse.json(DEFAULT_DASHBOARD, { status: 200 });
    }

    // The database might return this as a string, so we parse it.
    // If your DB driver auto-parses JSON, this is just a safety check.
    if (typeof layout === 'string') {
      layout = JSON.parse(layout);
    }

    return NextResponse.json(layout, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard layout:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT - Saves a new dashboard layout for the user.
 * The new layout (from the request body) will completely replace the old one.
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get the new layout from the frontend
    const newLayout = await request.json();

    if (!newLayout || !newLayout.layout || !newLayout.widgets) {
        return NextResponse.json({ message: 'Invalid layout data' }, { status: 400 });
    }

    // We must stringify the JSON object to save it in the database
    const layoutString = JSON.stringify(newLayout);

    // Update the user's row
    await db.query(
      'UPDATE sites SET dashboard_layout = ? WHERE user_email = ?',
      [layoutString, session.user.email]
    );

    return NextResponse.json({ message: 'Dashboard saved successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error saving dashboard layout:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}