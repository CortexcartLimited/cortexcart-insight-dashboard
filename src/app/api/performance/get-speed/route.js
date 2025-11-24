import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Get the site URL from your database
        const [rows] = await db.query(
            'SELECT site_url FROM sites WHERE user_email = ?',
            [session.user.email]
        );

        if (rows.length === 0 || !rows[0].site_url) {
            return NextResponse.json({ error: 'Site URL not configured' }, { status: 404 });
        }

        let url = rows[0].site_url;
        // Ensure URL has https://
        if (!url.startsWith('http')) url = `https://${url}`;

        // 2. Call Google PageSpeed API (Public API, no auth needed usually)
        // We explicitly ask for 'performance' category to get the score
        const apiKey = process.env.GOOGLE_API_KEY || ''; // Optional: Use if you have one to avoid rate limits
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo${apiKey ? `&key=${apiKey}` : ''}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch PageSpeed data');
        }

        // 3. Extract Data safely
        const lighthouse = data.lighthouseResult;
        
        // METRICS: Core Web Vitals
        const audits = lighthouse.audits || {};
        const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
        const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';
        const fcp = audits['first-contentful-paint']?.displayValue || 'N/A';
        
        // SCORE: The 0-100 Performance Score
        // It comes as 0.95, so we multiply by 100
        const performancScore = lighthouse.categories?.performance?.score 
            ? Math.round(lighthouse.categories.performance.score * 100) 
            : 0;

        return NextResponse.json({
            score: performancScore, // This was likely missing or named wrong before
            metrics: { lcp, cls, fcp }
        });

    } catch (error) {
        console.error('PageSpeed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}