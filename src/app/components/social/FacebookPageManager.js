'use client';

import { useState, useEffect } from 'react';

export default function FacebookPageManager() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPages = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/social/facebook/pages');
                if (!response.ok) throw new Error('Could not fetch Facebook pages.');
                const data = await response.json();
                setPages(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPages();
    }, []);

    const handleSetActivePage = async (pageId) => {
        // Here you would call an API to set this page as the active one for posting
        console.log('Setting active page:', pageId);
        // This is a placeholder for the API call
        // await fetch('/api/social/facebook/active-page', { method: 'POST', body: JSON.stringify({ pageId }) });
    };

    if (loading) return <p className="text-sm text-gray-500 mt-4">Loading Facebook Pages...</p>;
    if (error) return <p className="text-sm text-red-500 mt-4">{error}</p>;

    return (
        <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-700">Connected Facebook Pages</h4>
            {pages.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">No pages found. Try reconnecting your account.</p>
            ) : (
                <ul className="mt-2 space-y-3">
                    {pages.map(page => (
                        <li key={page.page_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-3">
                                <img src={page.picture_url} alt={page.page_name} className="w-8 h-8 rounded-full" />
                                <span className="text-sm font-medium">{page.page_name}</span>
                            </div>
                            <button
                                onClick={() => handleSetActivePage(page.page_id)}
                                className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-gray-400"
                                disabled={page.is_active}
                            >
                                {page.is_active ? 'Active' : 'Set Active'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {/* You would add a similar component here for Instagram accounts */}
        </div>
    );
}