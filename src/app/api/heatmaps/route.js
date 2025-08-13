import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pagePath = searchParams.get('path');
    const siteId = session.user.email;

    if (!pagePath) {
        return NextResponse.json({ message: 'Page path is required' }, { status: 400 });
    }

    try {
        // --- NEW: Cooldown Logic ---
        const [lastReport] = await db.query(
            `SELECT created_at FROM analysis_reports 
             WHERE user_email = ? AND report_type = ? AND report_details = ?
             ORDER BY created_at DESC LIMIT 1`,
            [siteId, 'heatmap', pagePath]
        );

        if (lastReport.length > 0) {
            const lastReportTime = new Date(lastReport[0].created_at);
            // Set a 1-hour cooldown period
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); 
            if (lastReportTime > oneHourAgo) {
                return NextResponse.json({ message: 'You can generate a heatmap for this page once per hour. Please try again later.' }, { status: 429 });
            }
        }
        // --- End of Cooldown Logic ---

        // Log this analysis attempt for rate-limiting purposes
        // We will need to add a 'report_details' column to the table first
        await db.query(
             'INSERT INTO analysis_reports (user_email, report_type, report_details) VALUES (?, ?, ?)',
             [siteId, 'heatmap', pagePath]
         );

        const query = `
            SELECT JSON_EXTRACT(event_data, '$.x') as x, JSON_EXTRACT(event_data, '$.y') as y
            FROM events
            WHERE site_id = ? AND event_name = 'click' AND JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.path')) = ? AND created_at >= NOW() - INTERVAL 30 DAY;
        `;
        
        const [results] = await db.query(query, [siteId, pagePath]);

        const heatmapData = results.map(row => ({ x: row.x, y: row.y, value: 1 }));

        return NextResponse.json(heatmapData, { status: 200 });

    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
