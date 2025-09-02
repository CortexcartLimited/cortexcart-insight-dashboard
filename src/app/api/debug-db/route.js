import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Attempt to get a connection and run a simple query
    await db.query('SELECT 1');
    
    // If we reach here, the connection is successful
    return NextResponse.json({ status: 'success', message: 'Database connection successful!' });
  } catch (error) {
    // If there's an error, the connection failed
    console.error("Database connection debug error:", error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database connection failed.',
        // This will give us the specific database error details
        errorDetails: {
          code: error.code,
          message: error.message
        } 
      }, 
      { status: 500 }
    );
  }
}