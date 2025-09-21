'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import FacebookPageManager from '@/app/components/social/FacebookPageManager';

export default function SocialConnectionsClient() {
    const [connections, setConnections] = useState({});
    const [facebookPages, setFacebookPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ type: '', message: '' });
    const searchParams = useSearchParams();

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch connection statuses
            const statusResponse = await fetch('/api/social/connections/status');
            if (!statusResponse.ok) throw new Error('Failed to load connection status.');
            const connectionsData = await statusResponse.json();
            setConnections(connectionsData);

            // If Facebook is connected, fetch its pages
            if (connectionsData.facebook) {
                const pagesResponse = await fetch('/api/social/facebook/pages');
                if (!pagesResponse.ok) throw new Error('Could not fetch Facebook pages.');
                const pagesData = await pagesResponse.json();
                setFacebookPages(pagesData);
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const success = searchParams.get('success');
        if (success) {
            const platform = success.split('_')[0];
            setNotification({ type: 'success', message: `Successfully connected your ${platform} account!` });
        }
        fetchAllData();
    }, [searchParams, fetchAllData]);

    const handleSetActivePage = async (pageId) => {
        try {
            const response = await fetch('/api/social/facebook/active-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId })
            });

            if (!response.ok) {
                throw new Error('Failed to set active page.');
            }
            
            // Re-fetch all data to ensure UI is perfectly in sync with the database
            await fetchAllData();

        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };
    
    // ... (ConnectionButton component remains the same)
    const ConnectionButton = ({ platform, connectUrl }) => {
        const isConnected = connections[platform];

        if (isConnected) {
            return (
                <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                    <CheckCircleIcon className="w-5 h-5" />
                    Connected
                </div>
            );
        }

        return (
            <a href={connectUrl} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-black">
                Connect {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </a>
        );
    };

    return (
        <div>
            {notification.message && (
                <div className={`p-4 mb-4 text-sm rounded-lg ${
                    notification.type === 'success' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                }`}>
                    {notification.message}
                </div>
            )}

            <div className="p-6 border rounded-lg bg-white shadow-sm">
                <h3 className="font-semibold text-gray-800">Connect Your Accounts</h3>
                <div className="mt-4 space-y-4">
                    {loading ? <p>Loading connections...</p> : (
                        <>
                            <div>
                                <div className="flex justify-between items-center">
                                    <span>Facebook & Instagram</span>
                                    <ConnectionButton platform="facebook" connectUrl="/api/connect/facebook" />
                                </div>
                                {connections.facebook && (
                                    <FacebookPageManager 
                                        pages={facebookPages}
                                        onSetActive={handleSetActivePage}
                                        loading={loading}
                                    />
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span>X (Twitter)</span>
                                <ConnectionButton platform="x" connectUrl="/api/connect/twitter" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span>YouTube</span>
                                <ConnectionButton platform="youtube" connectUrl="/api/connect/youtube" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Pinterest</span>
                                <ConnectionButton platform="pinterest" connectUrl="/api/connect/pinterest" />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}