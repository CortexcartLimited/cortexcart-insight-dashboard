import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const eventData = await request.json();
    const { siteId, eventName, data } = eventData;

    if (!siteId || !eventName) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Load User Agent Parser
    const UAParser = require('ua-parser-js');
    const ua = request.headers.get('user-agent');
    const parser = new UAParser(ua);
    const deviceType = parser.getDevice().type || 'desktop';

    // 2. Get IP Address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    
    let country = null;

    // 3. Attempt GeoIP Lookup (Fails gracefully on live servers)
    if (ip && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        // Note: Free ip-api often blocks cloud server IPs (AWS/Vercel)
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          country = geoData.country;
        }
      } catch (geoError) {
        // Silently fail if API is blocked or down
        console.warn("GeoIP lookup failed (likely rate limited or blocked):", geoError.message);
      }
    }
    
    // 4. CRITICAL FIX: Fallback to 'Unknown' if country is null
    // This ensures the row is NOT filtered out by your SQL query
    const finalCountry = country || 'Unknown';

    const dataWithMeta = { 
        ...data, 
        ip, 
        country: finalCountry, 
        device: deviceType 
    };

    // 5. Save to Database
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