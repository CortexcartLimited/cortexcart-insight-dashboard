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
        // FIX: Use 'ga4_property_id' and 'credentials_json'
        const [rows] = await db.query(
            'SELECT ga4_property_id, credentials_json FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length === 0 || !rows[0].credentials_json) {
            return NextResponse.json({ error: 'GA4 not configured' }, { status: 404 });
        }

        const { ga4_property_id, credentials_json } = rows[0];
        
        // Decrypt/Parse Logic
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
            dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'conversions' },
                { name: 'userEngagementDuration' }
            ],
        });

        // Safe Data Mapping
        const metricHeaders = response.metricHeaders.map(h => h.name);
        const row = response.rows?.[0];

        const getValue = (name) => {
            if (!row) return 0;
            const index = metricHeaders.indexOf(name);
            return index !== -1 ? parseInt(row.metricValues[index].value) : 0;
        };

        const stats = {
            users: getValue('activeUsers'),
            sessions: getValue('sessions'),
            pageviews: getValue('screenPageViews'),
            conversions: getValue('conversions'),
            averageEngagementDuration: getValue('userEngagementDuration') / (getValue('activeUsers') || 1),
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('GA4 Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}