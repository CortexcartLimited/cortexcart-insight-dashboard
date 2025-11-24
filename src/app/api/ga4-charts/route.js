import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

function formatCredentials(creds) {
    if (creds && creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    return creds;
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const [rows] = await db.query(
            'SELECT ga4_property_id, credentials_json FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length === 0 || !rows[0].credentials_json) {
            return NextResponse.json({ error: 'GA4 not configured' }, { status: 404 });
        }

        const { ga4_property_id, credentials_json } = rows[0];
        
        let credentials;
        try {
             const decrypted = decrypt(credentials_json);
             credentials = decrypted ? JSON.parse(decrypted) : JSON.parse(credentials_json);
        } catch (e) {
             credentials = JSON.parse(credentials_json);
        }
        credentials = formatCredentials(credentials);

        const client = new BetaAnalyticsDataClient({ credentials });
        
        const [response] = await client.runReport({
            property: `properties/${ga4_property_id}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'screenPageViews' }, { name: 'conversions' }],
            orderBys: [{ dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' } }],
        });

        const chartData = response.rows ? response.rows.map(row => ({
            date: row.dimensionValues[0].value, // Returns YYYYMMDD
            views: parseInt(row.metricValues[0].value),
            conversions: parseInt(row.metricValues[1].value),
        })) : [];
        
        // Helper to format YYYYMMDD to readable date
        const formattedChartData = chartData.map(item => {
             const y = item.date.substring(0, 4);
             const m = item.date.substring(4, 6);
             const d = item.date.substring(6, 8);
             return { ...item, date: `${y}-${m}-${d}` };
        });

        return NextResponse.json(formattedChartData);
    } catch (error) {
        console.error('GA4 Charts Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}