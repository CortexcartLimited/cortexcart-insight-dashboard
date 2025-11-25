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

function formatDate(dateStr) {
    if (!dateStr) return '28daysAgo';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '28daysAgo';
        return d.toISOString().split('T')[0];
    } catch (e) { return '28daysAgo'; }
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let startDate = formatDate(searchParams.get('startDate'));
    let endDate = formatDate(searchParams.get('endDate') || 'today');
    if (new Date(startDate) > new Date(endDate)) startDate = endDate;

    try {
        const [rows] = await db.query(
            'SELECT ga4_property_id, credentials_json FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length === 0 || !rows[0].credentials_json) {
            // Return null so the UI shows the "No Data" message instead of an error
            return NextResponse.json(null); 
        }

        const { ga4_property_id, credentials_json } = rows[0];
        let credentials;
        try {
            const decrypted = decrypt(credentials_json);
            if (decrypted) credentials = JSON.parse(decrypted);
        } catch (e) {}
        if (!credentials) {
             try { credentials = JSON.parse(credentials_json); } catch (e) { return NextResponse.json(null); }
        }

        credentials = formatCredentials(credentials);
        const client = new BetaAnalyticsDataClient({ credentials });

        // Fetch Google Ads Specific Metrics
        // These metrics REQUIRE a Google Ads link in GA4 to populate.
        const [response] = await client.runReport({
            property: `properties/${ga4_property_id}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [
                { name: 'advertiserAdClicks' },
                { name: 'advertiserAdCost' },
                { name: 'advertiserAdImpressions' },
                { name: 'advertiserAdConversions' }
            ]
        });

        if (!response.rows || response.rows.length === 0) {
             // No data found (likely no Ads link)
             return NextResponse.json(null);
        }

        const row = response.rows[0];
        const adsData = {
            advertiserAdClicks: row.metricValues[0].value,
            advertiserAdCost: row.metricValues[1].value,
            advertiserAdImpressions: row.metricValues[2].value,
            advertiserAdConversions: row.metricValues[3].value,
        };

        return NextResponse.json(adsData);

    } catch (error) {
        console.error('Google Ads API Error:', error);
        // Return a specific error object so the UI can show a helpful message
        return NextResponse.json({ error: error.message });
    }
}