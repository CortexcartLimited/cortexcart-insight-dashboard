import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    try {
        const [rows] = await db.query(
            'SELECT ga4_property_id, credentials_json FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length === 0 || !rows[0].credentials_json) {
            return NextResponse.json({ error: 'GA4 Not Connected' }, { status: 404 });
        }

        const { ga4_property_id, credentials_json } = rows[0];
        let credentials = JSON.parse(decrypt(credentials_json));
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

        const client = new BetaAnalyticsDataClient({ credentials });

        // Query: Get Sessions & Revenue by Source/Medium
        const [response] = await client.runReport({
            property: `properties/${ga4_property_id}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [
                { name: 'sessionSource' }, // e.g., facebook, google, newsletter
                { name: 'sessionMedium' }  // e.g., cpc, organic, email
            ],
            metrics: [
                { name: 'sessions' },
                { name: 'grossPurchaseRevenue' }, // E-commerce revenue
                { name: 'conversions' }
            ],
            orderBys: [
                { metric: { metricName: 'sessions' }, desc: true }
            ],
            limit: 10
        });

        const data = response.rows.map(row => ({
            source: row.dimensionValues[0].value,
            medium: row.dimensionValues[1].value,
            sessions: parseInt(row.metricValues[0].value),
            revenue: parseFloat(row.metricValues[1].value).toFixed(2),
            conversions: parseInt(row.metricValues[2].value)
        }));

        return NextResponse.json(data);

    } catch (error) {
        console.error('GA4 Source Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}