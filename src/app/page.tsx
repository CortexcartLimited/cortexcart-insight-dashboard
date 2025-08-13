// src/app/page.tsx
import HomePageClient from './HomePageClient';
import { getHomepageContent, getRecentBlogPosts, getSubscriptionPlans } from '../lib/data'; // Import your new functions

interface Plan {
    name: string;
    description: string;
    price_monthly: string;
    features: string[];
    is_popular: boolean;
    stripe_price_id: string; // Make sure this is included if your client component needs it
}

async function getPageData() {
    try {
        // No more fetch! Use Promise.all to call the functions directly.
        const [content, blogPosts, plans] = await Promise.all([
            getHomepageContent(),
            getRecentBlogPosts(),
            getSubscriptionPlans()
        ]);

        return {
            content,
            recentPost: blogPosts.length > 0 ? blogPosts[0] : null,
            plans: plans as Plan[],
        };
    } catch (error) {
        console.error("Failed to fetch page data directly:", error);
        return { content: {}, recentPost: null, plans: [] };
    }
}

// generateMetadata can stay the same
export async function generateMetadata() {
    const data = await getPageData();
    return {
        title: data.content.hero_title || 'CortexCart | AI-Powered E-commerce Analytics',
        description: data.content.hero_subtitle || 'Stop guessing. Start growing.',
    };
}

// The main page component
export default async function HomePage() {
    const pageData = await getPageData();
    return <HomePageClient {...pageData} />;
}