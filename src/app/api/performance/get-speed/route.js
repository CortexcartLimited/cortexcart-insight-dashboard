import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { simpleCache } from '@/lib/cache'; // Import the cache

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const cacheKey = `speed-score-${userEmail}`;

    // --- 1. Check for a cached score first ---
    const cachedScore = simpleCache.get(cacheKey);
    if (cachedScore) {
        return NextResponse.json(cachedScore, { status: 200 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [lastReport] = await db.query(
        `SELECT created_at FROM analysis_reports WHERE user_email = ? AND report_type = 'page_speed' ORDER BY created_at DESC LIMIT 1`,
        [userEmail]
    );

    if (lastReport.length > 0 && new Date(lastReport[0].created_at) > twentyFourHoursAgo) {
        return NextResponse.json({ message: 'You can run a Page Speed test once per day.' }, { status: 429 });
    }

    try {
        const [sites] = await db.query('SELECT site_url FROM sites WHERE user_email = ?', [userEmail]);
        const siteUrl = sites[0]?.site_url;

        if (!siteUrl) {
            return NextResponse.json({ message: 'Site URL not found in settings.' }, { status: 404 });
        }

        const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
        const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(siteUrl)}&key=${apiKey}&strategy=mobile`;

        const response = await fetch(apiEndpoint);
        if (!response.ok) {
            throw new Error('Failed to get a response from PageSpeed Insights API.');
        }
        const data = await response.json();

        const performanceScore = data.lighthouseResult.categories.performance.score * 100;
        const lcp = data.lighthouseResult.audits['largest-contentful-paint'].displayValue;
        const cls = data.lighthouseResult.audits['cumulative-layout-shift'].displayValue;

        const performanceData = {
            score: Math.round(performanceScore),
            lcp,
            cls,
        };
        
        // --- 2. Save the new score to the cache for 24 hours ---
        simpleCache.set(cacheKey, performanceData, 86400); // 86400 seconds = 24 hours

        // Log the successful analysis
        await db.query(
            'INSERT INTO analysis_reports (user_email, report_type) VALUES (?, ?)',
            [userEmail, 'page_speed']
        );

        return NextResponse.json(performanceData, { status: 200 });

    } catch (error) {
        console.error("Error fetching PageSpeed data:", error);
        return NextResponse.json({ message: `Failed to fetch PageSpeed data: ${error.message}` }, { status: 500 });
    }
}
