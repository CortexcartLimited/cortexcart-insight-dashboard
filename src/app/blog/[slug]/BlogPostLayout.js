'use client';

import Link from 'next/link';
import Image from 'next/image';
import { marked } from 'marked';
import { useParams } from 'next/navigation';
import { UserCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const PublicLayout = ({ children }) => (
    <div className="bg-gray-50">
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
		{/* This is the new logo image, wrapped in a link to the homepage */}
                    <Link href="/" passHref>
                      <Image
                        src="/cortexcart-com-logo-home.png" // This points to /public/logo.png
                        alt="CortexCart Logo"
                        width={150} // Adjust this to your logo's width
                        height={40}  // Adjust this to your logo's height
                        priority // Helps load the logo faster on the homepage
                      />
                    </Link>
                <ul className="flex items-center space-x-6">
                    <li><Link href="/#features"><span className="hover:text-blue-600 cursor-pointer">Features</span></Link></li>
                    <li><a href="#pricing" className="hover:text-blue-600">Pricing</a></li>
                    <li><Link href="/blog"><span className="text-blue-600 font-semibold cursor-pointer">Blog</span></Link></li>
                    <li>
                        <Link href="/dashboard">
                            <div className="px-6 py-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors cursor-pointer">
                                Start Free Trial
                            </div>
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
        <main>{children}</main>
        <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-6 text-center">
                <p>&copy; {new Date().getFullYear()} CortexCart. All rights reserved.</p>
		        <div className="mt-4">
                        <Link href="/about"><span className="px-3 hover:underline cursor-pointer">About</span></Link>
                        <span className="text-gray-500">|</span>
                        <Link href="/contact"><span className="px-3 hover:underline cursor-pointer">Contact</span></Link>
                        <span className="text-gray-500">|</span>
     			 <Link href="/terms"><span className="px-3 hover:underline cursor-pointer">Terms of Service</span></Link>
                        <span className="text-gray-500">|</span>
                        <Link href="/privacy"><span className="px-3 hover:underline cursor-pointer">Privacy Policy</span></Link>    
                        </div>            
			</div>
        </footer>
    </div>
);

const SidebarPostCard = ({ post }) => (
    <Link href={`/blog/${post.slug}`}>
        <div className="flex space-x-4 group cursor-pointer">
            <div className="flex-shrink-0">
                <Image src={post.featured_image_url || 'https://placehold.co/100x100/E2E8F0/4A5568?text=Cortex'} alt={post.title} width={64} height={64} className="rounded-lg object-cover" />
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{post.title}</h4>
                <div className="mt-1 flex items-center text-xs text-gray-500">
                    {post.author_name && <span>{post.author_name}</span>}
                    {post.author_name && post.published_at && <span className="mx-1.5">&middot;</span>}
                    {post.published_at && (
                        <time dateTime={post.published_at}>
                            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </time>
                    )}
                </div>
            </div>
        </div>
    </Link>
);

const BlogCategoryNav = ({ activeCategory }) => {
    const params = useParams();
    const toSlug = (name) => name.toLowerCase().replace(/ & /g, '-and-').replace(/ /g, '-');
    const currentSlug = params.categorySlug || (activeCategory ? toSlug(activeCategory) : null);

    const categories = [
        'E-commerce Strategy', 'Data & Analytics', 'AI for E-commerce', 
        'Generative AI', 'Conversion Optimization', 'Product Updates'
    ];

    return (
        <div className="border-b border-gray-200 bg-white">
            <div className="container mx-auto">
                <nav className="flex" aria-label="Categories">
                    {categories.map((category, index) => {
                        const slug = toSlug(category);
                        const isActive = currentSlug === slug;
                        return (
                            <div key={category} className="flex items-center">
                                <Link href={`/blog/category/${slug}`} passHref>
                                    <div className={`whitespace-nowrap py-4 px-5 text-sm font-medium transition-colors duration-200 ease-in-out cursor-pointer ${isActive ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}>
                                        {category}
                                    </div>
                                </Link>
                                {index < categories.length - 1 && (<span className="h-6 w-px bg-gray-300" aria-hidden="true" />)}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default function BlogPostLayout({ post, sidebarPosts }) {
    if (!post) {
        return <PublicLayout><div className="text-center p-24">404 - Post Not Found</div></PublicLayout>;
    }

    const getMarkdownText = () => {
        const rawMarkup = marked.parse(post.content || '', { breaks: true });
        return { __html: rawMarkup };
    };

    const recentPosts = sidebarPosts ? sidebarPosts.slice(0, 2) : [];
    const relatedPosts = sidebarPosts ? sidebarPosts.slice(2, 4) : [];

    return (
        <PublicLayout>
            <BlogCategoryNav activeCategory={post.category} />
            <div className="container mx-auto px-6 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-8">
                    <aside className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24 space-y-8">
                            {sidebarPosts && sidebarPosts.length > 0 && (
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Articles</h3>
                                    <div className="space-y-4">
                                        {recentPosts.map(p => <SidebarPostCard key={p.id} post={p} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
                             <p className="text-base font-semibold leading-7 text-blue-600">
                                {post.category || 'General'}
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{post.title}</h1>
                            <div className="mt-6 flex items-center space-x-4 text-sm text-gray-500">
                                {post.author_name && (<div className="flex items-center"><UserCircleIcon className="h-5 w-5 mr-1.5" /><span>{post.author_name}</span></div>)}
                                {post.read_time_minutes && (<div className="flex items-center"><ClockIcon className="h-5 w-5 mr-1.5" /><span>{post.read_time_minutes} min read</span></div>)}
                            </div>
                            {post.featured_image_url && (
                                <figure className="mt-8">
                                    <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                                       <Image src={post.featured_image_url} alt={post.title} fill className="rounded-xl object-cover" priority />
                                    </div>
                                    {post.featured_image_attribution_text && (
                                        <figcaption className="mt-2 text-xs text-center text-gray-400">
                                            Image credit: <a href={post.featured_image_attribution_link || '#'} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">{post.featured_image_attribution_text}</a>
                                        </figcaption>
                                    )}
                                </figure>
                            )}
                            <div className="blog-content mt-8" dangerouslySetInnerHTML={getMarkdownText()} />
                        </div>
                    </div>
                    <aside className="lg:col-span-1 mt-12 lg:mt-0">
                         <div className="sticky top-24 space-y-8">
                             {sidebarPosts && sidebarPosts.length > 2 && (
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Related Articles</h3>
                                    <div className="space-y-4">
                                        {relatedPosts.map(p => <SidebarPostCard key={p.id} post={p} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
            <style jsx global>{`
                .blog-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.75rem;
                    margin-top: 2em;
                    margin-bottom: 2em;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                }
                /* other styles */
            `}</style>
        </PublicLayout>
    );
}
