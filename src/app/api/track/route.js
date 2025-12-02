import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import UAParser from 'ua-parser-js'; // Use import syntax

export async function POST(request) {
  try {
    const eventData = await request.json();
    const { siteId, eventName, data } = eventData;

    if (!siteId || !eventName) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Parse User Agent
    const ua = request.headers.get('user-agent');
    const parser = new UAParser(ua || ''); // Handle null UA
    const deviceType = parser.getDevice().type || 'desktop';

    // 2. Get IP Address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    
    let country = 'Unknown';

    // 3. Optimized GeoIP Lookup
    // Only attempt lookup if valid public IP. Set a strict timeout to prevent hanging.
    if (ip && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s Timeout

        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=country`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.country) country = geoData.country;
        }
      } catch (geoError) {
        // Ignore timeouts/errors to ensure event is still tracked
      }
    }
    
    const dataWithMeta = { 
        ...data, 
        ip, 
        country, // 'Unknown' is already set as default above
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