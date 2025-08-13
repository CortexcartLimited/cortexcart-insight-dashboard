// src/app/api/debug-env/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const nextAuthUrl = process.env.NEXTAUTH_URL || "Not Set";
  
  return NextResponse.json({
    nextAuthUrl: nextAuthUrl,
    message: "This is the value the server sees for NEXTAUTH_URL."
  });
}