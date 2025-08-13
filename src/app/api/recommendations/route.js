import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Fetch all past recommendation reports for the user
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        const [reports] = await db.query(
            'SELECT * FROM analysis_reports WHERE user_email = ? ORDER BY created_at DESC',
            [userEmail]
        );
        
        // If there are no reports, return an empty array right away.
        if (reports.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        const reportIds = reports.map(r => r.id);
        
        const [items] = await db.query(
            `SELECT * FROM recommendation_items WHERE report_id IN (?)`,
            [reportIds]
        );

        // Group items by their report_id
        const itemsByReport = items.reduce((acc, item) => {
            if (!acc[item.report_id]) {
                acc[item.report_id] = [];
            }
            acc[item.report_id].push(item);
            return acc;
        }, {});
        
        // Combine reports with their items
        const fullReports = reports.map(report => ({
            ...report,
            items: itemsByReport[report.id] || []
        }));

        return NextResponse.json(fullReports, { status: 200 });

    } catch (error) {
        console.error("Error fetching recommendation history:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH: Update the status of a specific recommendation item
export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { recommendationId, status } = await request.json();
        if (!recommendationId || !status) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await db.query(
            'UPDATE recommendation_items SET status = ? WHERE id = ?',
            [status, recommendationId]
        );

        return NextResponse.json({ message: 'Recommendation updated.' }, { status: 200 });

    } catch (error) {
        console.error("Error updating recommendation:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
