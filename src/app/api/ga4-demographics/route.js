import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

async function getGa4Data(propertyId, credentials) {
    const client = new BetaAnalyticsDataClient({ credentials });

    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'userAgeBracket' }, { name: 'userGender' }],
        metrics: [{ name: 'activeUsers' }],
    });

    const demographicsData = {
        age: {},
        gender: {},
    };

    response.rows.forEach(row => {
        const ageBracket = row.dimensionValues[0].value;
        const gender = row.dimensionValues[1].value;
        const users = parseInt(row.metricValues[0].value, 10);

        // Aggregate age data
        if (!demographicsData.age[ageBracket]) {
            demographicsData.age[ageBracket] = 0;
        }
        demographicsData.age[ageBracket] += users;

        // Aggregate gender data
        if (!demographicsData.gender[gender]) {
            demographicsData.gender[gender] = 0;
        }
        demographicsData.gender[gender] += users;
    });

    return demographicsData;
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT property_id, credentials_encrypted FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length === 0 || !rows[0].credentials_encrypted) {
            return NextResponse.json({ error: 'GA4 not configured' }, { status: 404 });
        }

        const { property_id, credentials_encrypted } = rows[0];
        
        const decrypted_credentials = decrypt(credentials_encrypted);
        if (!decrypted_credentials) {
            return NextResponse.json({ error: 'Failed to decrypt GA4 credentials' }, { status: 500 });
        }
        
        const credentials = JSON.parse(decrypted_credentials);
        const demographicsData = await getGa4Data(property_id, credentials);

        return NextResponse.json(demographicsData);
    } catch (error) {
        console.error('Error fetching GA4 Demographics data:', error);
        return NextResponse.json({ error: 'Failed to fetch GA4 Demographics data' }, { status: 500 });
    }
}