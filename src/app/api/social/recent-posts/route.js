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
    const platform = searchParams.get('platform'); // Optional now
    const userEmail = session.user.email;

    try {
        // We build the query dynamically based on whether 'platform' is present
        const platformFilter = platform ? 'AND platform = ?' : '';
        const queryParams = platform 
            ? [userEmail, platform, userEmail, platform] 
            : [userEmail, userEmail];

        const query = `
            SELECT * FROM (
                SELECT 
                    CAST(platform AS CHAR(50)) COLLATE utf8mb4_unicode_ci AS platform,
                    CAST(platform_post_id AS CHAR(255)) COLLATE utf8mb4_unicode_ci AS platform_post_id, 
                    CAST(content AS CHAR(255)) COLLATE utf8mb4_unicode_ci AS content, 
                    CAST(likes AS SIGNED) AS likes, 
                    CAST(shares AS SIGNED) AS shares, 
                    CAST(impressions AS SIGNED) AS impressions, 
                    CAST(posted_at AS DATETIME) AS posted_at 
                FROM historical_social_posts 
                WHERE user_email = ? ${platformFilter}
                
                UNION ALL
                
                SELECT 
                    CAST(platform AS CHAR(50)) COLLATE utf8mb4_unicode_ci AS platform,
                    CAST(platform_post_id AS CHAR(255)) COLLATE utf8mb4_unicode_ci AS platform_post_id, 
                    CAST(content AS CHAR(255)) COLLATE utf8mb4_unicode_ci AS content, 
                    CAST(likes AS SIGNED) AS likes, 
                    CAST(shares AS SIGNED) AS shares, 
                    CAST(impressions AS SIGNED) AS impressions, 
                    CAST(scheduled_at AS DATETIME) AS posted_at 
                FROM scheduled_posts 
                WHERE user_email = ? AND status = 'posted' ${platformFilter}
            ) AS all_posts
            ORDER BY posted_at DESC
            LIMIT 10;
        `;
        
        const [posts] = await db.query(query, queryParams);

        // Always return an array, even if empty
        return NextResponse.json(posts || [], { status: 200 });

    } catch (error) {
        console.error(`Error fetching recent posts:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}