import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
// We are removing the 'ua-parser-js' import from the top of the file.

export async function POST(request) {
  try {
    const eventData = await request.json();
    const { siteId, eventName, data } = eventData;

    if (!siteId || !eventName) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // --- THIS IS THE FIX ---
    // We now use require() to load the library inside the function.
// eslint-disable-next-line @typescript-eslint/no-require-imports
    const UAParser = require('ua-parser-js');
    const ua = request.headers.get('user-agent');
    const parser = new UAParser(ua);
    const deviceType = parser.getDevice().type || 'desktop';

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    let country = null;

    if (ip) {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          country = geoData.country;
        }
      } catch (geoError) {
        console.error("GeoIP lookup failed:", geoError);
      }
    }
    
    const dataWithMeta = { ...data, ip, country: country, device: deviceType };

    await db.query(
      'INSERT INTO events (site_id, event_name, event_data) VALUES (?, ?, ?);',
      [siteId, eventName, JSON.stringify(dataWithMeta)] 
    );

    const headers = { 'Access-Control-Allow-Origin': '*' };
    return NextResponse.json({ message: 'Event tracked' }, { status: 200, headers });
  } catch (error) {
    console.error('--- TRACK API CRASHED ---:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
