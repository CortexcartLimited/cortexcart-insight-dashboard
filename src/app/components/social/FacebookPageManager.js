'use client';
import { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const FacebookPageManager = () => {
    const [pages, setPages] = useState([]);
    const [activePage, setActivePage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFacebookData = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch both the list of available pages and the currently active page
                const [pagesRes, activePageRes] = await Promise.all([
                    fetch('/api/social/facebook/pages'),
                    fetch('/api/social/facebook/active-page')
                ]);

                if (!pagesRes.ok) {
                    const errorData = await pagesRes.json();
                    if (pagesRes.status === 401 || errorData.error?.includes('invalid')) {
                        throw new Error('Your Facebook connection has expired or is invalid. Please disconnect and reconnect.');
                    }
                    throw new Error(errorData.error || 'Failed to load your Facebook pages.');
                }
                
                const pagesData = await pagesRes.json();
                setPages(pagesData);

                if (activePageRes.ok) {
                    const activePageData = await activePageRes.json();
                    setActivePage(activePageData);
                }

            } catch (err) {
                setError(err.message);
                setPages([]); // Clear pages on error
            } finally {
                setLoading(false);
            }
        };

        fetchFacebookData();
    }, []);

    const handleSetActivePage = async (pageId) => {
        try {
            const res = await fetch('/api/social/facebook/active-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId }),
            });
            if (!res.ok) throw new Error('Failed to set active page.');
            
            // Refetch active page to update UI
            const activePageRes = await fetch('/api/social/facebook/active-page');
            if (activePageRes.ok) {
                setActivePage(await activePageRes.json());
            }

        } catch (err) {
            setError(err.message);
        }
    };
    
    if (loading) return <p>Loading Facebook pages...</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manage Connected Facebook Page</h3>
            {pages.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {pages.map((page) => (
                        <li key={page.id} className="py-3 flex items-center justify-between">
                            <span className="font-medium">{page.name}</span>
                            {activePage?.pageId === page.id ? (
                                <span className="flex items-center text-green-600">
                                    <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                                    Active
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleSetActivePage(page.id)}
                                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                                >
                                    Set as Active
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No Facebook pages found. Please ensure you have granted page access permissions.</p>
            )}
        </div>
    );
};

export default FacebookPageManager;