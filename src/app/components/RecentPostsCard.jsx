// File: src/app/components/RecentPostsCard.jsx

'use client';

import { useState, useEffect } from 'react';
import { HandThumbUpIcon, ArrowUturnRightIcon, EyeIcon } from '@heroicons/react/24/solid';

const TABS = {
    'x': 'X (Twitter)',
    'facebook': 'Facebook',
    'pinterest': 'Pinterest', // Add this line
    'youtube': 'YouTube'

};

export default function RecentPostsCard() {
    const [activeTab, setActiveTab] = useState('x');
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/social/recent-posts?platform=${activeTab}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to fetch posts.');
                }
                const data = await res.json();
                setPosts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [activeTab]); // This effect re-runs whenever the activeTab changes

    const Post = ({ post }) => (
        <li className="py-4">
            <div className="flex space-x-3">
                <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-700">{post.content}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span className="font-medium text-xs">
                            {new Date(post.posted_at).toLocaleString()}
                        </span>
                        <div className="flex space-x-4">
                            <span className="inline-flex items-center text-xs"><HandThumbUpIcon className="h-4 w-4 mr-1"/> {post.likes.toLocaleString()}</span>
                            <span className="inline-flex items-center text-xs"><ArrowUturnRightIcon className="h-4 w-4 mr-1"/> {post.shares.toLocaleString()}</span>
                            <span className="inline-flex items-center text-xs"><EyeIcon className="h-4 w-4 mr-1"/> {post.impressions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );

    return (
        <div className="bg-white p-6 rounded shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Posts</h3>
            <div>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {Object.entries(TABS).map(([key, name]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-4">
                    {isLoading ? <p className="text-center py-4 text-gray-500">Loading posts...</p> :
                     error ? <p className="text-center py-4 text-red-600">{error}</p> :
                     posts.length > 0 ? (
                        <ul role="list" className="divide-y divide-gray-200">
                            {posts.map((post) => <Post key={post.platform_post_id} post={post} />)}
                        </ul>
                     ) : <p className="text-center py-4 text-gray-500">No posts found for this platform.</p>
                    }
                </div>
            </div>
        </div>
    );
}