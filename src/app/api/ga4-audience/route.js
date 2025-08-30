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

        // --- THIS IS THE CORRECTED REQUEST ---
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${ga4Connection.ga4_property_id}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'newVsReturning' }],
            // We replaced 'activeUsers' with 'totalUsers' for better compatibility
            metrics: [{ name: 'totalUsers' }, { name: 'engagedSessions' }, { name: 'sessions' }],
        });
        // --- END CORRECTION ---

        let newUsers = 0;
        let returningUsers = 0;
        let engagedSessions = 0;
        let totalSessions = 0;

        // The logic here is updated to match the new metric order
        if (response.rows) {
            response.rows.forEach(row => {
                const userType = row.dimensionValues[0].value;
                const users = parseInt(row.metricValues[0].value, 10);
                
                if (userType === 'new') {
                    newUsers = users;
                } else if (userType === 'returning') {
                    returningUsers = users;
                }
                engagedSessions += parseInt(row.metricValues[1].value, 10);
                totalSessions += parseInt(row.metricValues[2].value, 10);
            });
        }
        
        const engagementRate = totalSessions > 0 ? (engagedSessions / totalSessions) * 100 : 0;

        const audienceData = {
            newVsReturning: [
                { name: 'New Users', value: newUsers },
                { name: 'Returning Users', value: returningUsers },
            ],
            engagementRate: engagementRate.toFixed(2),
            engagedSessions,
        };

        return NextResponse.json(audienceData, { status: 200 });
    } catch (error) {
        console.error('Error fetching GA4 Audience data:', error.details || error.message);
        const errorMessage = error.details || error.message || 'Failed to fetch audience data.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}