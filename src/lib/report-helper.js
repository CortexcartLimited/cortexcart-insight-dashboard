import { db } from '@/lib/db';

export async function getReportingData(identifier, startDate, endDate) {
    try {
        // 1. Resolve Site ID (Identifier can be email or ID)
        // We check if the identifier looks like an email. If so, get the ID.
        let siteId = identifier;
        let currency = '$'; // Default currency

        if (identifier.includes('@')) {
            const [siteRows] = await db.query(
                'SELECT id, currency FROM sites WHERE user_email = ?', 
                [identifier]
            );
            if (siteRows.length === 0) throw new Error("Site not found for this user");
            siteId = siteRows[0].id;
            currency = siteRows[0].currency || '$';
        }

        // 2. Set Dates
        const end = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 3. Get General Stats (Revenue, Visitors)
        // We use COALESCE to ensure we get 0 instead of null if no data exists
        const [stats] = await db.query(`
            SELECT 
                COALESCE(SUM(revenue), 0) as totalRevenue,
                COUNT(DISTINCT session_id) as visitors,
                COUNT(*) as pageviews
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ?
        `, [siteId, start, end]);

        // 4. Get Top Pages
        const [topPages] = await db.query(`
            SELECT pathname, COUNT(*) as views 
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ?
            GROUP BY pathname 
            ORDER BY views DESC 
            LIMIT 5
        `, [siteId, start, end]);

        // 5. Get Top Referrers
        const [referrers] = await db.query(`
            SELECT referrer, COUNT(*) as count 
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ? 
              AND referrer IS NOT NULL 
              AND referrer != ''
            GROUP BY referrer 
            ORDER BY count DESC 
            LIMIT 5
        `, [siteId, start, end]);

        return {
            dateRange: { start, end },
            currency,
            stats: {
                totalRevenue: stats[0]?.totalRevenue || 0,
                visitors: stats[0]?.visitors || 0,
                pageviews: stats[0]?.pageviews || 0
            },
            topPages,
            referrers
        };

    } catch (error) {
        console.error("Data Helper Error:", error);
        throw new Error(`Failed to fetch internal data: ${error.message}`);
    }
}