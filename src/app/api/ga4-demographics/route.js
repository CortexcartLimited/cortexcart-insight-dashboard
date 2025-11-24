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
    if (!session?.user?.email) {
        console.error("Demographics Error: User not authenticated");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Dates from URL
    const { searchParams } = new URL(req.url);
    const startDate = formatDate(searchParams.get('startDate'));
    const endDate = formatDate(searchParams.get('endDate') || 'today');

    try {
        // Debug Log: Check who is asking
        // console.log(`Fetching Demographics for: ${session.user.email}`);

        const [rows] = await db.query(
            'SELECT ga4_property_id, credentials_json FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        // Debug Log: Check what the DB returned
        if (rows.length === 0) {
            console.error(`Demographics Error: No DB record found for ${session.user.email}`);
            return NextResponse.json({ error: 'GA4 not configured' }, { status: 404 });
        }

        if (!rows[0].credentials_json) {
            console.error(`Demographics Error: Credentials column is empty for ${session.user.email}`);
            return NextResponse.json({ error: 'GA4 credentials missing' }, { status: 404 });
        }

        const { ga4_property_id, credentials_json } = rows[0];
        
        let credentials;
        try {
             const decrypted = decrypt(credentials_json);
             credentials = decrypted ? JSON.parse(decrypted) : JSON.parse(credentials_json);
        } catch (e) {
             // Fallback for raw JSON
             credentials = JSON.parse(credentials_json);
        }
        credentials = formatCredentials(credentials);

        const client = new BetaAnalyticsDataClient({ credentials });

        // Fetch Age, Gender, AND Country with DYNAMIC DATES
        const [response] = await client.runReport({
            property: `properties/${ga4_property_id}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'userAgeBracket' }, { name: 'userGender' }, { name: 'country' }],
            metrics: [{ name: 'activeUsers' }],
        });

        const demographicsData = {
            ageData: [],
            genderData: [],
            countryData: [],
        };

        const ageMap = {};
        const genderMap = {};
        const countryMap = {};

        if (response && response.rows) {
            response.rows.forEach(row => {
                const ageBracket = row.dimensionValues[0].value;
                const gender = row.dimensionValues[1].value;
                const country = row.dimensionValues[2].value;
                const users = parseInt(row.metricValues[0].value, 10);

                if (ageBracket && ageBracket !== '(not set)') {
                    ageMap[ageBracket] = (ageMap[ageBracket] || 0) + users;
                }
                if (gender && gender !== '(not set)') {
                    genderMap[gender] = (genderMap[gender] || 0) + users;
                }
                if (country) {
                    countryMap[country] = (countryMap[country] || 0) + users;
                }
            });
        }

        const format = (map) => Object.entries(map).map(([name, value]) => ({ name, value }));

        demographicsData.ageData = format(ageMap);
        demographicsData.genderData = format(genderMap);
        demographicsData.countryData = format(countryMap).sort((a, b) => b.value - a.value);

        return NextResponse.json(demographicsData);

    } catch (error) {
        console.error('Error fetching GA4 Demographics data:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch GA4 Demographics data', 
            details: error.message 
        }, { status: 500 });
    }
}