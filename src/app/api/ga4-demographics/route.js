import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    try {
        const [ga4Connections] = await db.query(
            'SELECT credentials_json, ga4_property_id FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );
        const ga4Connection = ga4Connections[0];

        if (!ga4Connection || !ga4Connection.credentials_json || !ga4Connection.ga4_property_id) {
            return NextResponse.json({ error: 'Google Analytics not configured.' }, { status: 400 });
        }

        const analyticsDataClient = new BetaAnalyticsDataClient({
            credentials: JSON.parse(ga4Connection.credentials_json),
        });

        const runReport = async (dimensions, metrics) => {
            const [response] = await analyticsDataClient.runReport({
                property: `properties/${ga4Connection.ga4_property_id}`,
                dateRanges: [{ startDate, endDate }],
                dimensions,
                metrics,
            });
            return response.rows.map(row => ({
                dimension: row.dimensionValues[0].value,
                metric: parseInt(row.metricValues[0].value, 10),
            }));
        };

        const [ageData, genderData, countryData] = await Promise.all([
            runReport([{ name: 'userAgeBracket' }], [{ name: 'totalUsers' }]),
            runReport([{ name: 'userGender' }], [{ name: 'totalUsers' }]),
            runReport([{ name: 'country' }], [{ name: 'totalUsers' }]),
        ]);

        return NextResponse.json({ ageData, genderData, countryData }, { status: 200 });
    } catch (error) {
        console.error('Error fetching GA4 Demographics data:', error);
        return NextResponse.json({ error: 'Failed to fetch demographics data.' }, { status: 500 });
    }
}