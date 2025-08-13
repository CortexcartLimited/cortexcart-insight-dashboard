import BlogPostLayout from './BlogPostLayout'; // Import the new client component

// This async function fetches data on the server
async function getPost(slug) {
    try {
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/blog/${slug}`;
        const res = await fetch(apiUrl, { cache: 'no-store' }); // Fetch fresh data
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch post:", error);
        return null;
    }
}

// This function generates metadata on the server
export async function generateMetadata({ params }) {
    const data = await getPost(params.slug);
    if (!data || !data.mainPost) {
        return { title: 'Post Not Found' };
    }
    return {
        title: data.mainPost.meta_title || data.mainPost.title,
        description: data.mainPost.meta_description || 'Read this article from the CortexCart blog.',
    };
}

// This is the main page component. It's now a Server Component.
export default async function BlogPostPage({ params }) {
    const data = await getPost(params.slug);
    
    // We pass the fetched data down to the Client Component as props
    return <BlogPostLayout post={data?.mainPost} sidebarPosts={data?.sidebarPosts} />;
}
