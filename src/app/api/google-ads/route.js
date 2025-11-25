import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

function formatCredentials(creds) {
    if (creds && creds.private_key) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
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

        // ✅ FIX: Add 'sessionCampaignName' dimension.
        // The API requires this dimension to properly report on advertiser metrics.
        const [response] = await client.runReport({
            property: `properties/${ga4_property_id}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'sessionCampaignName' }], 
            metrics: [
                { name: 'advertiserAdClicks' },
                { name: 'advertiserAdCost' },
                { name: 'advertiserAdImpressions' }
            ]
        });

        // ✅ AGGREGATE: Sum up the rows to get the totals
        let totalClicks = 0;
        let totalCost = 0;
        let totalImpressions = 0;

        if (response.rows && response.rows.length > 0) {
            response.rows.forEach(row => {
                // metricValues[0] = Clicks, [1] = Cost, [2] = Impressions
                totalClicks += parseInt(row.metricValues[0].value || 0);
                totalCost += parseFloat(row.metricValues[1].value || 0);
                totalImpressions += parseInt(row.metricValues[2].value || 0);
            });
        } else {
            // No ads data found
            return NextResponse.json(null);
        }

        const adsData = {
            advertiserAdClicks: totalClicks,
            advertiserAdCost: totalCost,
            advertiserAdImpressions: totalImpressions,
            advertiserAdConversions: 0 
        };

        return NextResponse.json(adsData);

    } catch (error) {
        console.error('Google Ads API Error:', error);
        return NextResponse.json({ error: error.message });
    }
}