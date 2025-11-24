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
    const type = searchParams.get('type');
    
    // 1. Validate Dates
    let startDate = formatDate(searchParams.get('startDate'));
    let endDate = formatDate(searchParams.get('endDate') || 'today');
    
    // Ensure start is not after end (causes INVALID_ARGUMENT)
    if (new Date(startDate) > new Date(endDate)) {
        startDate = endDate; 
    }

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
            if (decrypted) {
                credentials = JSON.parse(decrypted);
            }
        } catch (e) {}

        if (!credentials) {
            try {
                credentials = JSON.parse(credentials_json);
            } catch (e) {
                return NextResponse.json({ error: 'Invalid Credentials Format' }, { status: 500 });
            }
        }

        credentials = formatCredentials(credentials);
        const client = new BetaAnalyticsDataClient({ credentials });
        
        console.log(`[GA4 Deep Dive] Running report: ${type}`); // Debug Log

        let response;
        switch (type) {
            case 'stickiness':
                response = await client.runReport({
                    property: `properties/${ga4_property_id}`,
                    dateRanges: [{ startDate, endDate }],
                    metrics: [{ name: 'dauPerMau' }, { name: 'dauPerWau' }, { name: 'wauPerMau' }]
                });
                const stickinessRow = response[0].rows?.[0];
                return NextResponse.json({
                    dauPerMau: stickinessRow ? parseFloat(stickinessRow.metricValues[0].value) : 0,
                    dauPerWau: stickinessRow ? parseFloat(stickinessRow.metricValues[1].value) : 0,
                    wauPerMau: stickinessRow ? parseFloat(stickinessRow.metricValues[2].value) : 0,
                });

            case 'city':
                response = await client.runReport({
                    property: `properties/${ga4_property_id}`,
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'city' }, { name: 'country' }],
                    metrics: [{ name: 'activeUsers' }],
                    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                    limit: 10
                });
                return NextResponse.json(response[0].rows ? response[0].rows.map(row => ({
                    city: row.dimensionValues[0].value,
                    country: row.dimensionValues[1].value,
                    users: parseInt(row.metricValues[0].value)
                })) : []);

            case 'engaged_user':
                response = await client.runReport({
                    property: `properties/${ga4_property_id}`,
                    dateRanges: [{ startDate, endDate }],
                    metrics: [{ name: 'sessionsPerUser' }, { name: 'engagedSessions' }, { name: 'activeUsers' }]
                });
                const engRow = response[0].rows?.[0];
                const engagedSessions = engRow ? parseInt(engRow.metricValues[1].value) : 0;
                const activeUsers = engRow ? parseInt(engRow.metricValues[2].value) : 0;
                const ratio = activeUsers > 0 ? (engagedSessions / activeUsers).toFixed(2) : 0;
                return NextResponse.json({ ratio: parseFloat(ratio), engagedSessions, activeUsers });

            case 'queries':
                // FAILSAFE: This often fails if Search Console isn't linked.
                try {
                    response = await client.runReport({
                        property: `properties/${ga4_property_id}`,
                        dateRanges: [{ startDate, endDate }],
                        dimensions: [{ name: 'organicGoogleSearchQuery' }, { name: 'country' }],
                        metrics: [{ name: 'organicGoogleSearchClicks' }], 
                        orderBys: [{ metric: { metricName: 'organicGoogleSearchClicks' }, desc: true }],                        limit: 10
                    });
                    return NextResponse.json(response[0].rows ? response[0].rows.map(row => ({
                        country: row.dimensionValues[0].value,
                        query: row.dimensionValues[1].value,
                        sessions: parseInt(row.metricValues[0].value)
                    })) : []);
                } catch (err) {
                    console.warn("[GA4 Deep Dive] Queries report failed (likely no GSC link). Returning empty.");
                    return NextResponse.json([]); // Return empty list instead of error
                }

            case 'organic_landing':
                // FAILSAFE: This filter syntax can sometimes be strict
                try {
                    response = await client.runReport({
                        property: `properties/${ga4_property_id}`,
                        dateRanges: [{ startDate, endDate }],
                        dimensions: [{ name: 'landingPagePlusQueryString' }],
                        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                        dimensionFilter: {
                            filter: {
                                fieldName: 'sessionDefaultChannelGroup',
                                stringFilter: { 
                                    matchType: 'CONTAINS', 
                                    value: 'Organic',
                                    caseSensitive: false
                                }
                            }
                        },
                        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                        limit: 10
                    });
                    return NextResponse.json(response[0].rows ? response[0].rows.map(row => ({
                        page: row.dimensionValues[0].value,
                        users: parseInt(row.metricValues[0].value),
                        sessions: parseInt(row.metricValues[1].value)
                    })) : []);
                } catch (err) {
                    console.warn("[GA4 Deep Dive] Organic Landing report failed. Returning empty.");
                    return NextResponse.json([]);
                }

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

    } catch (error) {
        console.error(`GA4 Deep Dive Critical Error (${type}):`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}