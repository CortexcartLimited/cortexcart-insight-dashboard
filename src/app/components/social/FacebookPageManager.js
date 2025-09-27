// src/app/components/social/FacebookPageManager.js

'use client';
import { useState, useEffect, useCallback } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const FacebookPageManager = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [errorDetails, setErrorDetails] = useState(null); // State for detailed error
    const [activePageId, setActivePageId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        setErrorDetails(null);
        try {
            const res = await fetch('/api/social/facebook/pages');
            const data = await res.json();

            if (!res.ok) {
                // --- THIS IS THE CRITICAL CHANGE ---
                // We now capture and display the detailed error object.
                setError(data.error || 'Could not load Facebook pages.');
                setErrorDetails(data.details);
                throw new Error(data.error);
            }

            setPages(data.pages || []);
            setActivePageId(data.activePageId);

        } catch (err) {
            // Error is already set, so we just log it for debugging
            console.error("Error during fetch:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSetActivePage = async (pageId) => {
       // Functionality for setting active page
    };

    if (loading) return <p className="text-center text-gray-500">Loading pages...</p>;

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800">{error}</h3>
                        {/* Display the detailed error JSON if it exists */}
                        {errorDetails && (
                            <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded-md overflow-auto">
                                {JSON.stringify(errorDetails, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    // Render logic for pages...
    return (
        <div>...</div>
    );
};

export default FacebookPageManager;