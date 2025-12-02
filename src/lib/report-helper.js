import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto'; 

export async function getReportingData(identifier, startDate, endDate) {
    try {
        // 1. Resolve Site ID & User Email
        let siteId = identifier;
        let userEmail = identifier;
        let currency = '$';

        // If identifier is an email (which it usually is), get the Site ID
        if (identifier.includes('@')) {
            const [siteRows] = await db.query(
                'SELECT id, currency FROM sites WHERE user_email = ?', 
                [identifier]
            );
            if (siteRows.length > 0) {
                siteId = siteRows[0].id;
                currency = siteRows[0].currency || '$';
            }
        } else {
            // If identifier is an ID, we might need the email to fetch Shopify creds
            // (Assuming you passed email from the route, which you did. 
            // If you passed an ID, we'd need to reverse lookup the email here, 
            // but for now we'll assume identifier = email is the primary use case).
        }

        // 2. Set Dates (ISO Format for DB, various formats for APIs)
        const endObj = endDate ? new Date(endDate) : new Date();
        const startObj = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const endIso = endObj.toISOString().split('T')[0];
        const startIso = startObj.toISOString().split('T')[0];

        // 3. Get Traffic Stats (From INTERNAL 'events' table)
        const [trafficStats] = await db.query(`
            SELECT 
                COUNT(DISTINCT session_id) as visitors,
                COUNT(*) as pageviews
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ?
        `, [siteId, startIso, endIso]);

        // 4. Get Revenue (LIVE from Shopify API)
        let totalRevenue = 0;
        try {
            // Get credentials for this user
            const [storeRows] = await db.query(
                'SELECT store_url, access_token_encrypted FROM shopify_stores WHERE user_email = ?',
                [userEmail]
            );

            if (storeRows.length > 0) {
                const { store_url, access_token_encrypted } = storeRows[0];
                const accessToken = decrypt(access_token_encrypted);
                
                // Fetch orders from Shopify
                // Note: We fetch only 'total_price' to be efficient. 
                // Limit 250 is a safe batch for a quick report. 
                const queryParams = new URLSearchParams({
                    status: 'any',
                    created_at_min: startObj.toISOString(),
                    created_at_max: endObj.toISOString(),
                    limit: '250',
                    fields: 'total_price'
                });

                const shopifyRes = await fetch(`https://${store_url}/admin/api/2024-04/orders.json?${queryParams}`, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (shopifyRes.ok) {
                    const data = await shopifyRes.json();
                    // Sum up the revenue
                    totalRevenue = data.orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
                } else {
                    console.warn("Shopify API Error:", shopifyRes.statusText);
                }
            }
        } catch (shopifyErr) {
            console.error("Failed to fetch Shopify revenue:", shopifyErr);
            // We don't throw here, just leave revenue as 0 so the report still generates
        }

        // 5. Get Top Pages (Internal)
        const [topPages] = await db.query(`
            SELECT pathname, COUNT(*) as views 
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ?
            GROUP BY pathname 
            ORDER BY views DESC 
            LIMIT 5
        `, [siteId, startIso, endIso]);

        // 6. Get Top Referrers (Internal)
        const [referrers] = await db.query(`
            SELECT referrer, COUNT(*) as count 
            FROM events 
            WHERE site_id = ? AND created_at BETWEEN ? AND ? 
              AND referrer IS NOT NULL 
              AND referrer != ''
            GROUP BY referrer 
            ORDER BY count DESC 
            LIMIT 5
        `, [siteId, startIso, endIso]);

        return {
            dateRange: { start: startIso, end: endIso },
            currency,
            stats: {
                totalRevenue: totalRevenue, // Live from Shopify
                visitors: trafficStats[0]?.visitors || 0, // Internal
                pageviews: trafficStats[0]?.pageviews || 0 // Internal
            },
            topPages,
            referrers
        };

    } catch (error) {
        console.error("Data Helper Error:", error);
        throw new Error(`Failed to fetch report data: ${error.message}`);
    }
}