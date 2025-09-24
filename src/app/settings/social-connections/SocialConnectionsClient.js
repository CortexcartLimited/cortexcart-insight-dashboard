'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
// --- FIX 1: Import XCircleIcon ---
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'; 
import FacebookPageManager from '@/app/components/social/FacebookPageManager';

export default function SocialConnectionsClient() {
    const [connections, setConnections] = useState({});
    const [facebookPages, setFacebookPages] = useState([]);
    const [instagramAccounts, setInstagramAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ type: '', message: '' });
    const searchParams = useSearchParams();

    // ... (fetchAllData function remains the same)
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [statusRes, pagesRes, igRes] = await Promise.all([
                fetch('/api/social/connections/status'),
                fetch('/api/social/facebook/pages'),
                fetch('/api/social/instagram/accounts')
            ]);
            
            const connectionsData = await statusRes.json();
            const pagesData = await pagesRes.json();
            const igData = await igRes.json();

            setConnections(connectionsData);
            setFacebookPages(pagesData);
            setInstagramAccounts(igData);

        } catch (err) {
            setNotification({ type: 'error', message: 'Failed to load social connection data.' });
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        // ... (useEffect remains the same)
        const success = searchParams.get('success');
        if (success) {
            const platform = success.split('_')[0];
            setNotification({ type: 'success', message: `Successfully connected your ${platform} account!` });
        }
        fetchAllData();
    }, [searchParams, fetchAllData]);

    // ... (handleSetActivePage and handleSetActiveIg remain the same)
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
            
            await fetchAllData();

        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };
     const handleSetActiveIg = async (instagramId) => {
        try {
            const response = await fetch('/api/social/instagram/active-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instagramId })
            });

            if (!response.ok) {
                throw new Error('Failed to set active Instagram account.');
            }
            
            await fetchAllData();

        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    // ... (handleDisconnect remains the same)
    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
        
        try {
            const response = await fetch(`/api/social/disconnect/${platform}`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error(`Failed to disconnect ${platform}.`);

            setNotification({ type: 'success', message: `Successfully disconnected ${platform}!` });
            await fetchAllData();

        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };


    const ConnectionButton = ({ platform, connectUrl }) => {
        // ... (This component is now correct because XCircleIcon is imported)
         const isConnected = connections[platform];

        if (isConnected) {
            return (
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                        <CheckCircleIcon className="w-5 h-5" />
                        Connected
                    </div>
                    <button 
                        onClick={() => handleDisconnect(platform)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                        <XCircleIcon className="w-4 h-4" />
                        Disconnect
                    </button>
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
            {/* ... (notification div remains the same) ... */}
            
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
                                        instagramAccounts={instagramAccounts}
                                        // --- FIX 2: Match the prop name to the child component ---
                                        onSetActivePage={handleSetActivePage}
                                        onSetActiveIg={handleSetActiveIg}
                                        loading={loading}
                                    />
                                )}
                            </div>
                            
                            {/* ... (other platforms remain the same) ... */}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}