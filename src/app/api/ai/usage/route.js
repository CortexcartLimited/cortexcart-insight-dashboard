import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Correct import path
import { db } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    // Return 0s if not logged in, don't throw error
    return NextResponse.json({ used: 0, limit: 0 });
  }

  try {
    const [rows] = await db.query(
      'SELECT gemini_tokens_used, gemini_token_limit FROM sites WHERE user_email = ?', 
      [session.user.email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ used: 0, limit: 0 });
    }

    return NextResponse.json({ 
      used: rows[0].gemini_tokens_used || 0, 
      limit: rows[0].gemini_token_limit || 100000 // Default fallback
    });
  } catch (error) {
    console.error("Error fetching AI usage:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}