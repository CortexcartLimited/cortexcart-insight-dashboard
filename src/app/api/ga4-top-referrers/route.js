import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db'; // Import the mysql2 connection
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

        const [ga4Connections] = await db.query(
        'SELECT * FROM ga4_connections WHERE user_email = ?',
        [session.user.email]
    );
    const ga4Connection = ga4Connections[0];


    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    try {
        const [ga4Connections] = await db.query(
            'SELECT credentials_json, ga4_property_id FROM ga4_connections WHERE user_email = ?',
            [session.user.email]);

        if (!ga4Connection || !ga4Connection.credentials_json || !ga4Connection.ga4_property_id) {
            return NextResponse.json({ error: 'Google Analytics not configured.' }, { status: 400 });
        }

        const credentials = JSON.parse(ga4Connection.credentials_json);
        const ga4PropertyId = ga4Connection.ga4_property_id;

        const analyticsDataClient = new BetaAnalyticsDataClient({ credentials });

        const [response] = await analyticsDataClient.runReport({
            property: `properties/${ga4PropertyId}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'sessionSource' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{
                metric: { metricName: 'sessions' },
                desc: true,
            }],
            dimensionFilter: {
                notExpression: {
                    filter: {
                        fieldName: 'sessionSource',
                        stringFilter: {
                            matchType: 'EXACT',
                            value: '(direct)',
                        },
                    },
                },
            },
            limit: 10,
        });

        const referrers = (response.rows || []).map(row => ({
            referrer: row.dimensionValues[0].value,
            views: parseInt(row.metricValues[0].value, 10),
        }));

        return NextResponse.json(referrers);
    } catch (error) {
        console.error('Error fetching GA4 Top Referrers data:', error);
        return NextResponse.json({ error: 'Failed to fetch data from Google Analytics.', details: error.message }, { status: 500 });
    }
}
