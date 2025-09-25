'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import FacebookPageManager from '@/app/components/social/FacebookPageManager';

export default function SocialConnectionsClient() {
    const [connections, setConnections] = useState({});
    const [facebookPages, setFacebookPages] = useState([]);
    const [instagramAccounts, setInstagramAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ type: '', message: '' });
    const searchParams = useSearchParams();

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [statusRes, pagesRes, igRes] = await Promise.all([
                fetch('/api/social/connections/status'),
                fetch('/api/social/facebook/pages'),
                fetch('/api/social/instagram/accounts')
            ]);
            
            if (!statusRes.ok || !pagesRes.ok || !igRes.ok) {
                throw new Error('Failed to load social connection data.');
            }
            
            const connectionsData = await statusRes.json();
            const pagesData = await pagesRes.json();
            const igData = await igRes.json();

            console.log("Fetched Pages:", pagesData);
            console.log("Fetched Instagram Accounts:", igData);

            setConnections(connectionsData);
            setFacebookPages(Array.isArray(pagesData) ? pagesData : []);
            setInstagramAccounts(Array.isArray(igData) ? igData : []);

        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchParams.get('success')) {
            setNotification({ type: 'success', message: 'Account connected successfully!' });
        }
        fetchAllData();
    }, [searchParams, fetchAllData]);

    const handleSetActivePage = async (pageId) => {
        await fetch('/api/social/facebook/active-page', {
            method: 'POST', body: JSON.stringify({ pageId }), headers: { 'Content-Type': 'application/json' }
        });
        await fetchAllData();
    };
    
    const handleSetActiveIg = async (instagramId) => {
        await fetch('/api/social/instagram/active-account', {
            method: 'POST', body: JSON.stringify({ instagramId }), headers: { 'Content-Type': 'application/json' }
        });
        await fetchAllData();
    };

    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
        await fetch(`/api/social/disconnect/${platform}`, { method: 'POST' });
        await fetchAllData();
    };

    const ConnectionButton = ({ platform, connectUrl }) => {
        const isConnected = connections[platform];
        if (isConnected) {
            return (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                        <CheckCircleIcon className="w-5 h-5" /> Connected
                    </div>
                    <button onClick={() => handleDisconnect(platform)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold">
                        <XCircleIcon className="w-4 h-4" /> Disconnect
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
                    {loading ? <p>Loading...</p> : (
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
                                        onSetActivePage={handleSetActivePage}
                                        onSetActiveIg={handleSetActiveIg}
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