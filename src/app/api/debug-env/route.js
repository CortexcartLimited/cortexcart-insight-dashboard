import { NextResponse } from 'next/server';

export async function GET() {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const databaseUrl = process.env.DATABASE_URL;

  // Let's also check the database host while we're here
  let dbHost = "Not Set or Invalid URL";
  if (databaseUrl) {
    try {
      dbHost = new URL(databaseUrl).hostname;
    } catch (e) {
      dbHost = "Invalid URL format";
    }
  }

  return NextResponse.json({
    NEXTAUTH_URL: nextAuthUrl || "--- NOT SET ---",
    DATABASE_HOST: dbHost,
  });
}
