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
        
        // 1. New vs Returning
        const [response] = await client.runReport({
            property: `properties/${ga4_property_id}`,
            dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'newVsReturning' }],
            metrics: [{ name: 'activeUsers' }],
        });

        const newVsReturning = response.rows ? response.rows.map(row => ({
            name: row.dimensionValues[0].value, // 'new' or 'returning'
            value: parseInt(row.metricValues[0].value),
        })) : [];

        // 2. Engagement Rate
        const [engagementResponse] = await client.runReport({
            property: `properties/${ga4_property_id}`,
            dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
            metrics: [{ name: 'engagementRate' }, { name: 'engagedSessions' }],
        });
        
        const engagementData = engagementResponse.rows?.[0] ? {
            engagementRate: parseFloat(engagementResponse.rows[0].metricValues[0].value) * 100, // Convert to %
            engagedSessions: parseInt(engagementResponse.rows[0].metricValues[1].value)
        } : { engagementRate: 0, engagedSessions: 0 };


        return NextResponse.json({
            newVsReturning,
            ...engagementData
        });

    } catch (error) {
        console.error('GA4 Audience Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}