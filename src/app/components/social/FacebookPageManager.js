// src/app/components/social/FacebookPageManager.js

'use client';
import { useState, useEffect, useCallback } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const FacebookPageManager = () => {
    const [pages, setPages] = useState([]);
    const [instagramAccounts, setInstagramAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activePageId, setActivePageId] = useState(null);
    const [activeIgId, setActiveIgId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch both pages and Instagram accounts
            const [pagesRes, igRes] = await Promise.all([
                fetch('/api/social/facebook/pages'),
                fetch('/api/social/instagram/accounts')
            ]);

            const pagesData = await pagesRes.json();
            const igData = await igRes.json();

            if (!pagesRes.ok) {
                throw new Error(pagesData.error || 'Could not load Facebook pages.');
            }
            if (!igRes.ok) {
                // This is a non-critical error, so we just log it.
                console.warn('Could not load Instagram accounts:', igData.error);
            }

            setPages(pagesData.pages || []);
            setActivePageId(pagesData.activePageId);
            setInstagramAccounts(igData || []);
            setActiveIgId(igData.find(acc => acc.is_active)?.instagram_user_id || null);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSetActivePage = async (pageId) => {
        try {
            const res = await fetch('/api/social/facebook/active-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId }),
            });
            if (!res.ok) throw new Error('Failed to set active page.');
            fetchData(); // Refresh data to show the change
        } catch (err) {
            setError(err.message);
        }
    };
    
    // Placeholder for Instagram active account logic
    const handleSetActiveIg = async (instagramId) => {
        // You would implement the API call to your backend here
        console.log("Setting active Instagram account:", instagramId);
        // Then call fetchData() to refresh
    };

    if (loading) return <p className="text-center text-gray-500">Loading pages...</p>;

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800">An error occurred</h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (pages.length === 0) {
        return <p className="text-center text-gray-500">No pages found for your connected Facebook account.</p>;
    }

    return (
        <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-700">Connected Pages & Profiles</h4>
            <ul className="mt-2 space-y-3">
                {pages.map((page) => {
                    const linkedIg = instagramAccounts.find(ig => ig.page_id === page.id);
                    const isPageActive = page.id === activePageId;
                    
                    return (
                        <li key={page.id} className="p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{page.name}</span>
                                <button
                                    onClick={() => handleSetActivePage(page.id)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${isPageActive ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                    disabled={isPageActive}
                                >
                                    {isPageActive ? "Active" : "Set Active"}
                                </button>
                            </div>
                            {linkedIg && (
                                 <div className="mt-3 ml-11 pl-4 border-l border-gray-200">
                                     <div className="flex items-center justify-between">
                                         <span className="text-sm text-gray-600">{linkedIg.username} (Instagram)</span>
                                         {/* You can add a button to set the IG account active here if needed */}
                                     </div>
                                 </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default FacebookPageManager;