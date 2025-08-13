// src/app/api/test-outbound/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log("Attempting to fetch from Google...");
    const response = await fetch('https://www.google.com');
    
    if (!response.ok) {
      throw new Error(`Google responded with status: ${response.status}`);
    }
    
    console.log("Successfully fetched from Google.");
    return NextResponse.json({ success: true, message: "Outbound HTTPS connection is working." });

  } catch (error) {
    console.error("Outbound HTTPS connection failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Outbound HTTPS connection failed.",
        error: error.message,
        cause: error.cause 
      }, 
      { status: 500 }
    );
  }
}