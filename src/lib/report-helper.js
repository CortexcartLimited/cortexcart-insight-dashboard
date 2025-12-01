import { db } from '@/lib/db';

export async function getReportingData(siteId, startDate, endDate) {
    try {
        // Default to last 30 days if no dates provided
        const end = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 1. Get General Stats (Revenue, Visitors)
        const [stats] = await db.query(`
            SELECT 
                SUM(revenue) as totalRevenue,
                COUNT(DISTINCT session_id) as visitors,
                COUNT(*) as pageviews
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ?
        `, [siteId, start, end]);

        // 2. Get Top Pages
        const [topPages] = await db.query(`
            SELECT pathname, COUNT(*) as views 
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ?
            GROUP BY pathname 
            ORDER BY views DESC 
            LIMIT 5
        `, [siteId, start, end]);

        // 3. Get Top Referrers
        const [referrers] = await db.query(`
            SELECT referrer, COUNT(*) as count 
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ? AND referrer IS NOT NULL
            GROUP BY referrer 
            ORDER BY count DESC 
            LIMIT 5
        `, [siteId, start, end]);

        return {
            dateRange: { start, end },
            stats: stats[0] || { totalRevenue: 0, visitors: 0, pageviews: 0 },
            topPages,
            referrers
        };

    } catch (error) {
        console.error("Data Helper Error:", error);
        throw new Error("Failed to fetch internal data");
    }
}