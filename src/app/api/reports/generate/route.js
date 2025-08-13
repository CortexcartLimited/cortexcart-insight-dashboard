import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

async function fetchInternalAPI(path, appUrl, cookie) {
    const response = await fetch(`${appUrl}${path}`, {
        headers: { 'Cookie': cookie }
    });
    if (!response.ok) return null;
    return response.json();
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cookie = request.headers.get('cookie') || '';

    try {
        // --- RATE LIMITING LOGIC (Step 1) ---
        const [lastReport] = await db.query(
            `SELECT created_at FROM analysis_reports 
             WHERE user_email = ? AND report_type = 'detailed_summary' 
             ORDER BY created_at DESC LIMIT 1`,
            [userEmail]
        );

        if (lastReport.length > 0) {
            const lastReportTime = new Date(lastReport[0].created_at);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (lastReportTime > twentyFourHoursAgo) {
                return NextResponse.json({ message: 'You can generate one detailed report per day. Please try again later.' }, { status: 429 });
            }
        }
        // --- END OF RATE LIMITING LOGIC ---

        const [stats] = await Promise.all([
            fetchInternalAPI(`/api/stats?siteId=${userEmail}`, appUrl, cookie),
        ]);

        if (!stats) throw new Error('Could not fetch site statistics to generate report.');

        const aiResponseContent = `
## Overall Performance Summary
This is a sample AI-generated report. The system gathered the following data: Total Revenue: ${stats.totalRevenue}, Page Views: ${stats.pageviews}.

## Concluding Thoughts
This is a solid foundation. Focusing on marketing will likely yield great results.
        `;

        // Log this report generation for rate-limiting purposes
        await db.query(
            'INSERT INTO analysis_reports (user_email, report_type) VALUES (?, ?)',
            [userEmail, 'detailed_summary']
        );

        // Save the generated report content
        const [result] = await db.query(
            'INSERT INTO generated_reports (user_email, report_content, status) VALUES (?, ?, ?)',
            [userEmail, aiResponseContent, 'completed']
        );

        await db.query(
            'INSERT INTO notifications (user_email, message, link) VALUES (?, ?, ?)',
            [userEmail, 'Your new AI Performance Report is ready.', '/reports']
        );

        return NextResponse.json({ message: 'Report generated successfully!', reportId: result.insertId }, { status: 201 });

    } catch (error) {
        console.error("Error generating report:", error);
        return NextResponse.json({ message: `Failed to generate report: ${error.message}` }, { status: 500 });
    }
}
