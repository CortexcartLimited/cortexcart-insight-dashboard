// src/app/api/user/platform-connections/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// --- THIS IS THE FIX ---
// This forces the route to run on the Node.js server, not the Edge.
export const runtime = 'nodejs';
// --- END OF FIX ---

// Define which platform names to count as "platforms"
const PLATFORM_NAMES = [
  'shopify',
  'mailchimp',
  'quickbooks'
  // e.g., 'google_analytics', 'klaviyo', etc.
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Query the social_connections table
    const [rows] = await db.query(
      `SELECT COUNT(*) as currentConnections 
       FROM social_connect 
       WHERE user_email = ? 
       AND platform IN (?) 
       AND is_active = 1`,
      [session.user.email, PLATFORM_NAMES]
    );

    const count = rows[0]?.currentConnections || 0;

    return NextResponse.json({ currentConnections: count }, { status: 200 });

  } catch (error) {
    console.error('Error fetching platform connection count:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}