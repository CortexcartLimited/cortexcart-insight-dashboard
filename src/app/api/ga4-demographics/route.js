import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// HELPER: Fixes the private key if it has escaped newlines (common server issue)
function formatCredentials(creds) {
    if (creds && creds.private_key) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
    return creds;
}

async function getGa4Data(propertyId, credentials) {
    const client = new BetaAnalyticsDataClient({ credentials });

    // Fetch Age, Gender, AND Country
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
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

            // Aggregate Age
            if (ageBracket && ageBracket !== '(not set)') {
                ageMap[ageBracket] = (ageMap[ageBracket] || 0) + users;
            }

            // Aggregate Gender
            if (gender && gender !== '(not set)') {
                genderMap[gender] = (genderMap[gender] || 0) + users;
            }

            // Aggregate Country
            if (country) {
                countryMap[country] = (countryMap[country] || 0) + users;
            }
        });
    }

    // Format for Recharts
    const format = (map) => Object.entries(map).map(([name, value]) => ({ name, value }));

    demographicsData.ageData = format(ageMap);
    demographicsData.genderData = format(genderMap);
    demographicsData.countryData = format(countryMap).sort((a, b) => b.value - a.value);

    return demographicsData;
}

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            'SELECT ga4_property_id FROM ga4_connections WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length === 0 || !rows[0].credentials_encrypted) {
            return NextResponse.json({ error: 'GA4 not configured' }, { status: 404 });
        }

        const { property_id, credentials_encrypted } = rows[0];
        
        const decrypted_credentials = decrypt(credentials_encrypted);
        if (!decrypted_credentials) {
            return NextResponse.json({ error: 'Failed to decrypt GA4 credentials' }, { status: 500 });
        }
        
        // FIX: Parse and then format the credentials to fix newlines
        let credentials = JSON.parse(decrypted_credentials);
        credentials = formatCredentials(credentials);
        
        const demographicsData = await getGa4Data(property_id, credentials);

        return NextResponse.json(demographicsData);
    } catch (error) {
        console.error('Error fetching GA4 Demographics data:', error);
        // Return the ACTUAL error message so you can debug it in the browser
        return NextResponse.json({ 
            error: 'Failed to fetch GA4 Demographics data', 
            details: error.message 
        }, { status: 500 });
    }
}