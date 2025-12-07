'use client';
import { useState, useEffect } from 'react';
import { HeartIcon, EyeIcon } from '@heroicons/react/24/solid';

export default function TopSocialPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // We can reuse the existing social analytics route but filter differently on frontend
    // or create a dedicated route. For simplicity, let's use the existing one if it returns posts,
    // otherwise we might need a quick new route.
    // Let's assume we create a quick route for this specific view.
    fetch('/api/social/recent-posts?limit=5&sortBy=engagement')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(console.error);
  }, []);

  if (posts.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Content</h3>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            {/* Platform Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                ${post.platform === 'facebook' ? 'bg-blue-600' : 
                  post.platform === 'instagram' ? 'bg-pink-600' : 
                  post.platform === 'youtube' ? 'bg-red-600' : 'bg-black'}`}>
                {post.platform[0].toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 line-clamp-2 font-medium">
                    {post.content || "Image Post / No Caption"}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3" /> {post.impressions?.toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-pink-600"><HeartIcon className="w-3 h-3" /> {post.likes?.toLocaleString()}</span>
                    <span>{new Date(post.posted_at).toLocaleDateString()}</span>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}