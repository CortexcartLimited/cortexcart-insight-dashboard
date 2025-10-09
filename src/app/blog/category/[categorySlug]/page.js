'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
		    <li><Link href="/#pricing"><span className="hover:text-blue-600 cursor-pointer">Pricing</span></Link></li>
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

const BlogCategoryNav = () => {
    const categories = [
        'E-commerce Strategy', 
        'Data & Analytics', 
        'AI for E-commerce', 
        'Generative AI', 
        'Conversion Optimization', 
        'Product Updates'
    ];
    // Corrected and simplified the slug generation
    const toSlug = (name) => name.toLowerCase().replace(/ /g, '-');

    return (
        <div className="border-b border-gray-200 bg-white">
            <nav className="container mx-auto -mb-px flex space-x-8 overflow-x-auto px-6" aria-label="Categories">
                {categories.map((category) => (
                <Link key={category} href={`/blog/category/${toSlug(category)}`}>
                    <div className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium cursor-pointer">
                        {category}
                    </div>
                </Link>
                ))}
            </nav>
        </div>
    );
};

const PostCard = ({ post }) => (
    <article className="flex flex-col items-start justify-between">
        <div className="relative w-full">
            <Image src={post.featured_image_url || 'https://placehold.co/600x400/E2E8F0/4A5568?text=CortexCart'} alt={post.title} width={600} height={400} className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10"></div>
        </div>
        <div className="max-w-xl">
            <div className="mt-8 flex items-center gap-x-4 text-xs">
                <time dateTime={post.published_at} className="text-gray-500">
                    {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
            </div>
            <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                    <Link href={`/blog/${post.slug}`}>
                        <span className="absolute inset-0"></span>
                        {post.title}
                    </Link>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">{post.meta_description}</p>
            </div>
        </div>
    </article>
);


export default function CategoryPage() {
    const { categorySlug } = useParams();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const categoryName = categorySlug ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';

    useEffect(() => {
        if (categorySlug) {
            async function fetchPosts() {
                setIsLoading(true); // Reset loading state for each category change
                try {
                    const res = await fetch(`/api/blog/category/${categorySlug}`);
                    if (!res.ok) throw new Error('Failed to load posts for this category');
                    const data = await res.json();
                    setPosts(data);
                } catch (error) {
                    console.error(error);
                    setPosts([]); // Clear posts on error
                } finally {
                    setIsLoading(false);
                }
            }
            fetchPosts();
        }
    }, [categorySlug]);

    return (
        <PublicLayout>
            <BlogCategoryNav />
            <div className="bg-white py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Category: {categoryName}</h2>
                        <p className="mt-2 text-lg leading-8 text-gray-600">
                           Browse all articles in the {categoryName} category.
                        </p>
                    </div>
                    {isLoading ? (
                        <p className="text-center mt-8">Loading posts...</p>
                    ) : posts.length > 0 ? (
                        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                           {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                         <p className="text-center mt-16 text-gray-500">No posts found in this category yet.</p>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
