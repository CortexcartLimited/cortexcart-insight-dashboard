import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { simpleCache } from '@/lib/cache';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;
    
    try {
        const [sites] = await db.query('SELECT site_url FROM sites WHERE user_email = ?', [userEmail]);
        const siteUrl = sites[0]?.site_url;

        if (!siteUrl) {
            return NextResponse.json({ message: 'Site URL not found in settings.' }, { status: 404 });
        }

        const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
        const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(siteUrl)}&key=${apiKey}&strategy=mobile`;

        const response = await fetch(apiEndpoint);

        // --- IMPROVED ERROR LOGGING ---
        if (!response.ok) {
            const errorBody = await response.json(); // Get the detailed error from Google
            console.error("PageSpeed API Error:", errorBody); // Log the full error
            // Create a more specific error message
            const errorMessage = errorBody.error?.message || 'Failed to get a response from PageSpeed Insights API.';
            throw new Error(errorMessage);
        }
        // --- END IMPROVEMENT ---

        const data = await response.json();

        const performanceScore = data.lighthouseResult.categories.performance.score * 100;
        const lcp = data.lighthouseResult.audits['largest-contentful-paint'].displayValue;
        const cls = data.lighthouseResult.audits['cumulative-layout-shift'].displayValue;

        const performanceData = {
            score: Math.round(performanceScore),
            lcp,
            cls,
        };
        
        const cacheKey = `speed-score-${userEmail}`;
        simpleCache.set(cacheKey, performanceData, 86400);

        await db.query(
            'INSERT INTO analysis_reports (user_email, report_type, score, lcp, cls) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score=VALUES(score), lcp=VALUES(lcp), cls=VALUES(cls), created_at=NOW()',
            [userEmail, 'page_speed', performanceData.score, performanceData.lcp, performanceData.cls]
        );

        return NextResponse.json(performanceData, { status: 200 });

    } catch (error) {
        console.error("Error fetching PageSpeed data:", error);
        // The frontend will now receive the more specific error message from Google
        return NextResponse.json({ message: `Failed to fetch PageSpeed data: ${error.message}` }, { status: 500 });
    }
}