import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Corrected: JOIN with blog_categories to include the category name
        const query = `
            SELECT p.id, p.title, p.slug, p.featured_image_url, p.meta_description, p.published_at, c.name AS category
            FROM blog_posts AS p
            LEFT JOIN blog_categories AS c ON p.category_id = c.id
	    WHERE p.status = 'published' AND p.published_at <= NOW() 
            ORDER BY p.published_at DESC
        `;
        const [posts] = await db.query(query);
        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        console.error('Error fetching published blog posts:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
