import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// A helper to map 2-letter country codes (like 'US') to 3-letter codes (like 'USA')
const countryCodeMapping = {
    US: 'USA', GB: 'GBR', CA: 'CAN', AU: 'AUS', DE: 'DEU', FR: 'FRA', 
    IN: 'IND', JP: 'JPN', CN: 'CHN', BR: 'BRA', RU: 'RUS', IT: 'ITA',
    ES: 'ESP', MX: 'MEX', KR: 'KOR', NL: 'NLD', SE: 'SWE', SG: 'SGP',
    // Add more mappings as needed
};

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new Response('Not authenticated', { status: 401 });
    }

    try {
        const [rows] = await db.query(
            `SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.country')) as country_code, 
                COUNT(*) as value 
             FROM events 
             WHERE 
                site_id = ? AND 
                event_name = 'pageview' AND 
                JSON_EXTRACT(event_data, '$.country') IS NOT NULL
             GROUP BY country_code 
             ORDER BY value DESC`,
            [session.user.site_id]
        );

        // Map the database results to the format Nivo expects
        const formattedData = rows.map(row => ({
            id: countryCodeMapping[row.country_code] || row.country_code, // Use 3-letter code if available
            value: row.value,
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Error fetching location data:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}