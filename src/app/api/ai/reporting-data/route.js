import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';
import { getReportingData } from '@/lib/report-helper';

// Helper function to safely fetch and parse JSON
async function fetchJson(url, options) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) return { error: `Failed with status ${response.status}`, data: null };
        return { error: null, data: await response.json() };
    } catch (error) {
        return { error: error.message, data: null };
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const absoluteUrl = process.env.NEXTAUTH_URL;
        // We need to forward the user's session cookie to our internal API calls
        const cookie = headers().get('cookie');
        const fetchOptions = { headers: { 'Cookie': cookie } };

        // Define all the data sources we need for the report
        const dataEndpoints = {
            analytics: `${absoluteUrl}/api/analytics/summary`,
            socialStatus: `${absoluteUrl}/api/social/connections/status`,
            mailchimpAudiences: `${absoluteUrl}/api/mailchimp/audiences`,
            mailchimpCampaigns: `${absoluteUrl}/api/mailchimp/campaigns`,
            mailchimpEcommerce: `${absoluteUrl}/api/mailchimp/ecommerce`,
        };

        // Fetch all data sources in parallel
        const results = await Promise.all(
            Object.entries(dataEndpoints).map(([key, url]) => 
                fetchJson(url, fetchOptions).then(result => ({ key, ...result }))
            )
        );

        // Aggregate the data into a single object
        const aggregatedData = {};
        for (const result of results) {
            if (result.error) {
                console.error(`Failed to fetch ${result.key}:`, result.error);
                aggregatedData[result.key] = { error: `Could not load data for ${result.key}.` };
            } else {
                aggregatedData[result.key] = result.data;
            }
        }

        return NextResponse.json(aggregatedData);

    } catch (error) {
        console.error("Failed to aggregate reporting data:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}