// src/lib/data.js
import { pool } from '@/lib/db'; 

// Logic from /api/content/homepage/route.js
export async function getHomepageContent() {
  const [rows] = await pool.query('SELECT content_key, content_value FROM cms_content');
  return rows.reduce((acc, row) => {
      acc[row.content_key] = row.content_value;
      return acc;
  }, {});
}

// Logic from /api/blog/route.js
export async function getRecentBlogPosts() {
  const query = `
      SELECT p.id, p.title, p.slug, p.featured_image_url, p.meta_description, p.published_at, c.name AS category
      FROM blog_posts AS p
      LEFT JOIN blog_categories AS c ON p.category_id = c.id
      WHERE p.status = 'published' AND p.published_at <= NOW() 
      ORDER BY p.published_at DESC
  `;
  const [posts] = await pool.query(query);
  return posts;
}

// Logic from /api/plans/route.js
export async function getSubscriptionPlans() {
  const [plans] = await pool.query(
      `SELECT name, description, price_monthly, stripe_price_id, features, is_popular 
       FROM subscription_plans 
       WHERE is_active = TRUE 
       ORDER BY price_monthly ASC`
  );
  return plans.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : [],
  }));
}