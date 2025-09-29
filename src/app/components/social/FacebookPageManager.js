// src/app/components/social/FacebookPageManager.js

'use client';
import { useState, useEffect, useCallback } from 'react';
import { ExclamationTriangleIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

const FacebookPageManager = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activePageId, setActivePageId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/social/facebook/pages');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Could not load Facebook pages.');
            }

            setPages(data.pages || []);
            setActivePageId(data.activePageId);

        } catch (err) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSetActivePage = async (pageId) => {
        setError('');
        try {
            const res = await fetch('/api/social/facebook/active-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to set active page.');
            }
            fetchData(); // Refresh data to show the change
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <Cog6ToothIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading pages...</p>
            </div>
        );
    }

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
        return <p className="text-center text-gray-500 p-4">No pages found for your connected Facebook account.</p>;
    }

    return (
        <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-700">Manage Active Facebook Page</h4>
            <ul className="mt-2 space-y-2">
                {pages.map((page) => {
                    const isPageActive = page.id === activePageId;
                    return (
                        <li key={page.id} className="p-3 bg-gray-50 rounded-md flex items-center justify-between">
                            <span className="text-sm font-medium">{page.name}</span>
                            <button
                                onClick={() => handleSetActivePage(page.id)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${isPageActive ? "bg-green-600 text-white cursor-default" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                disabled={isPageActive}
                            >
                                {isPageActive ? "Active" : "Set Active"}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default FacebookPageManager;