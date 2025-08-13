import { db } from '@/lib/db';import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    console.log("\n--- [DEBUG] Category API Route Hit ---");
    try {
        const { categorySlug } = params;
        console.log(`[DEBUG 1] Received categorySlug: '${categorySlug}'`);

        // Step 1: Find the category ID from the provided URL slug.
        // NOTE: Please double-check your table/column names here.
        const findCategoryQuery = `
            SELECT id FROM blog_categories 
            WHERE REPLACE(REPLACE(LOWER(name), ' & ', '-and-'), ' ', '-') = ?
        `;
        console.log("[DEBUG 2] Running query to find category ID...");
        const [categoryResult] = await db.query(findCategoryQuery, [categorySlug]);

        if (categoryResult.length === 0) {
            console.log("[DEBUG 3] No category found for this slug. Returning empty array.");
            return NextResponse.json([], { status: 200 });
        }

        const categoryId = categoryResult[0].id;
        console.log(`[DEBUG 3] Found categoryId: ${categoryId}`);

        // Step 2: Fetch all published posts that belong to that category ID.
        // NOTE: Please double-check your table/column names here.
        const postsQuery = `
            SELECT 
                p.id, p.title, p.slug, p.featured_image_url, p.meta_description, p.published_at,
                c.name AS category
            FROM 
                blog_posts AS p
            LEFT JOIN 
                blog_categories AS c ON p.category_id = c.id
            WHERE 
                p.status = 'published' AND p.category_id = ?
            ORDER BY 
                p.published_at DESC
        `;
        console.log(`[DEBUG 4] Running query to fetch posts for categoryId: ${categoryId}`);
        const [posts] = await db.query(postsQuery, [categoryId]);
        console.log(`[DEBUG 5] Found ${posts.length} posts. Returning them to the frontend.`);

        return NextResponse.json(posts, { status: 200 });

    } catch (error) {
        console.error('--- [DEBUG] CATEGORY API CRASHED ---:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
