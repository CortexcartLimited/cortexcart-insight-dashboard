// src/app/settings/social-connections/page.js
'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';

// This is the main component for the page
export default function SocialConnectionsPage() {
    const [statuses, setStatuses]         = useState({});
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');
    const [facebookPages, setFacebookPages] = useState([]);
    const [instagramAccounts, setInstagramAccounts] = useState([]);
    const [activePageId, setActivePageId] = useState(null);
    const [activeInstagramId, setActiveInstagramId] = useState(null);

    // State for the confirmation modal
    const [platformToDisconnect, setPlatformToDisconnect] = useState(null);
    const [disconnectError, setDisconnectError] = useState('');

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const statusRes = await fetch('/api/social/connections/status');
            if (!statusRes.ok) throw new Error('Could not fetch connection statuses.');
            const connectionStatuses = await statusRes.json();
            setStatuses(connectionStatuses);

            if (connectionStatuses.facebook?.isConnected) {
                const [pagesRes, igRes, activeRes] = await Promise.all([
                    fetch('/api/social/facebook/pages'),
                    fetch('/api/social/instagram/accounts'),
                    fetch('/api/social/facebook/active-page')
                ]);
                if (pagesRes.ok) setFacebookPages(await pagesRes.json());
                if (igRes.ok) setInstagramAccounts(await igRes.json());
                if (activeRes.ok) setActivePageId((await activeRes.json()).active_facebook_page_id);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);
    
    const handleConnectPage = async (pageId) => {
        try {
            const selectedPage = facebookPages.find(p => p.page_id === pageId);
            if (!selectedPage) throw new Error("Selected page not found.");

            const res = await fetch('/api/social/facebook/connect-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pageId: selectedPage.page_id,
                    pageName: selectedPage.page_name,
                    pageAccessToken: selectedPage.access_token 
                })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to connect page.');
            setActivePageId(pageId); // Update UI immediately
        } catch (error) {
            console.error("Error connecting page:", error);
            // You can also set an alert here
        }
    };
    
    const handleDisconnect = async () => {
        if (!platformToDisconnect) return;
        setDisconnectError('');
        try {
            const response = await fetch(`/api/social/disconnect/${platformToDisconnect}`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to disconnect.');
            
            fetchInitialData(); // Refetch all data to update the UI
            setPlatformToDisconnect(null); // Close the modal
        } catch (err) {
            setDisconnectError(err.message);
        }
    };
    
    const platformConfig = {
        facebook: { name: 'Facebook & Instagram', description: 'Manage pages, accounts, and post content.', connectUrl: '/api/connect/facebook' },
        x: { name: 'X (Twitter)', description: 'Connect to post tweets and view analytics.', connectUrl: '/api/connect/twitter' },
        youtube: { name: 'YouTube', description: 'Connect to upload videos and sync analytics.', connectUrl: '/api/connect/youtube' },
        pinterest: { name: 'Pinterest', description: 'Connect to post pins and manage boards.', connectUrl: '/api/connect/pinterest' },
    };

    if (loading) return <Layout><p className="p-8">Loading connections...</p></Layout>;

    return (
        <Layout>
           <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">Social Connections</h2>
                <Link href="/settings" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
                               Back to Settings Page
                            </Link>
                 </div>
                <p className="mt-1 text-sm text-gray-500">Manage your connected social media accounts.</p>
           
            
            <div className="space-y-6 max-w-4xl">
                {Object.entries(platformConfig).map(([key, config]) => (
                    <div key={key} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-800">{config.name}</p>
                                <p className="text-sm text-gray-500">{config.description}</p>
                            </div>
                            {statuses[key]?.isConnected ? (
                                <div className="flex items-center gap-x-4">
                                    <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                                    <button onClick={() => setPlatformToDisconnect(key)} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                                </div>
                            ) : (
                                <a href={config.connectUrl} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Connect</a>
                            )}
                        </div>
                        {/* Show page/account selectors only if the main platform is connected */}
                        {key === 'facebook' && statuses.facebook?.isConnected && (
                            <div className="mt-4 pt-4 border-t space-y-4">
                                {/* Facebook Pages */}
                                <div>
                                    <h4 className="text-base font-medium text-gray-800">Your Facebook Pages</h4>
                                    {facebookPages.length > 0 ? (
                                        <ul className="mt-2 space-y-2">
                                            {facebookPages.map(page => (
                                                <li key={page.page_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                                    <div className="flex items-center">
                                                        {page.picture_url && <Image src={page.picture_url} alt={page.page_name} className="h-8 w-8 rounded-full mr-3" width={32} height={32}/>}
                                                        <span className="text-sm">{page.page_name}</span>
                                                    </div>
                                                    {page.page_id === activePageId ? (
                                                        <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Active</span>
                                                    ) : (
                                                        <button onClick={() => handleConnectPage(page.page_id)} className="px-3 py-1 text-sm bg-white border rounded-md hover:bg-gray-100">Set as Active</button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-sm text-gray-500 mt-2">No pages found.</p>}
                                </div>
                                {/* Instagram Accounts can be added here in the same way */}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Disconnect Confirmation Modal */}
            {platformToDisconnect && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold">Disconnect {platformConfig[platformToDisconnect].name}?</h3>
                        <p className="mt-2 text-sm text-gray-600">Are you sure? This will revoke access.</p>
                        {disconnectError && <p className="mt-3 text-xs text-red-600">{disconnectError}</p>}
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setPlatformToDisconnect(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                            <button onClick={handleDisconnect} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Disconnect</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}