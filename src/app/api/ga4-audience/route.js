import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

async function getAudienceData(propertyId, credentials) {
    const client = new BetaAnalyticsDataClient({ credentials });

    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'audienceName' }],
        metrics: [{ name: 'activeUsers' }],
    });

    const audienceData = {};
    response.rows.forEach(row => {
        const audienceName = row.dimensionValues[0].value;
        const users = parseInt(row.metricValues[0].value, 10);
        audienceData[audienceName] = users;
    });

    return audienceData;
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
        const audienceData = await getAudienceData(property_id, credentials);
        
        return NextResponse.json(audienceData);
    } catch (error) {
        console.error('Error fetching GA4 Audience data:', error);
        return NextResponse.json({ error: 'Failed to fetch audience data' }, { status: 500 });
    }
}