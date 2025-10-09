// src/app/api/ga4-charts/route.js

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
        const propertyId = connections[0]?.ga4_property_id;

        if (!propertyId) {
            throw new Error("GA4 Property ID has not been set.");
        }

        // This report fetches Page Views and Conversions for each day in the date range.
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'date' }], // We want the data broken down by date
            metrics: [
                { name: 'screenPageViews' },
                { name: 'conversions' },
            ],
            orderBys: [{ dimension: { orderType: "ALPHANUMERIC", dimensionName: "date" }}] // Order by date
        });

        const chartData = response.rows?.map(row => ({
            date: `${row.dimensionValues[0].value.slice(0, 4)}-${row.dimensionValues[0].value.slice(4, 6)}-${row.dimensionValues[0].value.slice(6, 8)}`,
            pageviews: parseInt(row.metricValues[0].value, 10),
            conversions: parseInt(row.metricValues[1].value, 10)
        })) || [];

        return NextResponse.json(chartData, { status: 200 });
    } catch (error) {
        console.error('Error fetching GA4 chart data:', error);
        return NextResponse.json({ message: `Failed to fetch GA4 chart data: ${error.message}` }, { status: 500 });
    }
}
