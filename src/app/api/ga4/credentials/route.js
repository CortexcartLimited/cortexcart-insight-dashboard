import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const analyticsDataClient = new BetaAnalyticsDataClient();

    try {
        const [connections] = await db.query(
            'SELECT ga4_property_id FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (connections.length === 0) {
            throw new Error("Your GA4 Property ID has not been set. Please add it in the Settings > Integrations tab.");
        }

        const ga4Stats = {
            users: 0,
            pageviews: 0,
            sessions: 0,
            conversions: 0,
        };

        for (const connection of connections) {
            const propertyId = connection.ga4_property_id;
            const [response] = await analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
                metrics: [
                    { name: 'totalUsers' },
                    { name: 'screenPageViews' },
                    { name: 'sessions' },
                    { name: 'conversions' },
                ],
            });

            if (response.rows && response.rows.length > 0) {
                ga4Stats.users += parseInt(response.rows[0].metricValues[0].value, 10);
                ga4Stats.pageviews += parseInt(response.rows[0].metricValues[1].value, 10);
                ga4Stats.sessions += parseInt(response.rows[0].metricValues[2].value, 10);
                ga4Stats.conversions += parseInt(response.rows[0].metricValues[3].value, 10);
            }
        }

        return NextResponse.json(ga4Stats, { status: 200 });
    } catch (error) {
        console.error('Error fetching GA4 data:', error);
        return NextResponse.json({ message: `Failed to fetch GA4 data: ${error.message}` }, { status: 500 });
    }
}