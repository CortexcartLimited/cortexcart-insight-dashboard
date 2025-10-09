import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { slug } = params;

        // Corrected: JOIN with blog_categories to get the category name
        const mainPostQuery = `
            SELECT p.*, c.name AS category_name 
            FROM blog_posts AS p
            LEFT JOIN blog_categories AS c ON p.category_id = c.id
            WHERE p.slug = ? AND p.status = 'published' AND p.published_at <= NOW()
        `;
        const [mainPostResult] = await db.query(mainPostQuery, [slug]);

        if (mainPostResult.length === 0) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }
        
        // The post object now has `category_name` which the frontend can use.
        const mainPost = {
            ...mainPostResult[0],
            category: mainPostResult[0].category_name // Ensure the 'category' property exists for the frontend
        };

        const sidebarPostsQuery = `
            SELECT p.id, p.title, p.slug, p.featured_image_url, p.author_name, p.published_at, c.name AS category
            FROM blog_posts AS p
            LEFT JOIN blog_categories AS c ON p.category_id = c.id
            WHERE p.status = 'published' AND p.id != ?
            ORDER BY p.published_at DESC
            LIMIT 4
        `;
        const [sidebarPosts] = await db.query(sidebarPostsQuery, [mainPost.id]);

        return NextResponse.json({ mainPost, sidebarPosts }, { status: 200 });

    } catch (error) {
        console.error('Error fetching single post:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
