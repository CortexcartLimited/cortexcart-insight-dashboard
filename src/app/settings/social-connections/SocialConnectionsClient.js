'use client';
import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { Cog6ToothIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FacebookPageManager from '@/app/components/social/FacebookPageManager';
import InstagramAccountManager from '@/app/components/social/InstagramAccountManager';
import WhatsAppConnect from './WhatsAppConnect'; // <--- IMPORTED HERE
import useSWR from 'swr';
import Link from 'next/link';

// Fetcher function should be defined *outside* the component
const fetcher = (url) => fetch(url).then((res) => res.json());

const SocialConnectionsClient = () => {
    // State for individual connection statuses (e.g., { facebook: true, x: false })
    const [connections, setConnections] = useState({});
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState('');

    // State for modals/managers
    const [showFacebookManager, setShowFacebookManager] = useState(false);
    const [showInstagramManager, setShowInstagramManager] = useState(false);

    // --- SWR Hooks for Plan and Connection Count ---
    const { data: planData, error: planError, isLoading: planLoading } = useSWR('/api/billing/my-plan', fetcher);
    const { data: connectionsCountData, error: connectionsCountError, isLoading: connectionsLoading, mutate: mutateConnectionsCount } = useSWR('/api/user/social-connections', fetcher);
    // --- End SWR Hooks ---

    const userPlan = planData; 
    const maxConnections = userPlan?.limits?.maxSocialConnections ?? 0;
    const currentConnections = connectionsCountData?.currentConnections ?? 0;

    const isLoading = planLoading || connectionsLoading || statusLoading;
    const combinedError = planError || connectionsCountError || statusError;
    const hasReachedLimit = (maxConnections > 0) && (currentConnections >= maxConnections);

    // Fetches the ON/OFF status for each platform
    const fetchConnectionStatuses = useCallback(async () => {
        setStatusLoading(true);
        setStatusError('');
        try {
            const res = await fetch('/api/social/connections/status');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load statuses.');

            const connectionStatuses = {};
            if (data.connections && Array.isArray(data.connections)) {
                data.connections.forEach(conn => {
                    connectionStatuses[conn.platform.toLowerCase()] = conn.status === 'connected';
                });
            }
            setConnections(connectionStatuses);
        } catch (err) {
            setStatusError(err.message);
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConnectionStatuses();
    }, [fetchConnectionStatuses]);

    // Handle standard OAuth Connects (FB, X, etc.)
    const handleConnect = (platform) => {
        if (hasReachedLimit) {
             alert(`You have reached your limit of ${maxConnections} social platforms. Please upgrade your plan.`);
             return;
        }
        window.location.href = `/api/connect/${platform}`;
    };

    // Handle Disconnects
    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect your ${platform.charAt(0).toUpperCase() + platform.slice(1)} account?`)) {
            return;
        }
        setStatusError('');
        try {
            // Special handling for WhatsApp since it uses a different delete endpoint in your backend usually,
            // but if you unified it to /api/social/disconnect/whatsapp, this works fine.
            // If not, we can adjust. Assuming unified endpoint for now:
            const res = await fetch(`/api/social/disconnect/${platform}`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Failed to disconnect ${platform}`);
            
            console.log(`Successfully disconnected ${platform}`);
            await fetchConnectionStatuses(); 
            await mutateConnectionsCount();
            
        } catch (err) {
            console.error(`Disconnect error for ${platform}:`, err);
            setStatusError(err.message);
        }
    };

    // --- Loading State ---
    if (isLoading) {
        return <div className="text-center p-8"><Cog6ToothIcon className="h-12 w-12 mx-auto text-gray-400 animate-spin" /><p className="mt-4">Loading...</p></div>;
    }

    if (combinedError) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex"><ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" /><div><p className="font-bold text-red-800">Error</p><p className="mt-1 text-sm text-red-700">{statusError}</p></div></div>
            </div>
        );
    }

    // Config for Standard OAuth Platforms
    const platformConfig = {
        x: { name: 'X (Twitter)' },
        facebook: { name: 'Facebook' },
        pinterest: { name: 'Pinterest' },
        instagram: { name: 'Instagram', note: 'Managed via your Facebook connection' },
        youtube: { name: 'YouTube' },
    };

    const isWhatsAppConnected = !!connections['whatsapp'];

    return (
        <div className="space-y-8">
            {/* Limit Banner */}
            {hasReachedLimit && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p className="font-bold">{userPlan?.name || 'Current Plan'} Limit Reached:</p>
                    <p>You have connected {currentConnections} / {maxConnections} platforms. <Link href="/upgrade-plans" className="underline font-semibold">Upgrade to add more.</Link></p>
                </div>
            )}

            {/* 1. WHATSAPP SECTION (Custom Card) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Messaging Integrations</h3>
                
                {isWhatsAppConnected ? (
                    // Connected State
                    <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-100">
                        <div className="flex items-center gap-3">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-10 h-10" />
                            <div>
                                <h4 className="font-bold text-gray-800">WhatsApp Business</h4>
                                <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Active & Connected
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDisconnect('whatsapp')}
                            className="text-red-600 text-sm font-semibold hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    // Disconnected State (Show the new component)
                    // We disable it if they hit the limit
                    hasReachedLimit ? (
                        <div className="opacity-50 pointer-events-none filter grayscale">
                             <WhatsAppConnect onConnect={() => { fetchConnectionStatuses(); mutateConnectionsCount(); }} />
                        </div>
                    ) : (
                        <WhatsAppConnect onConnect={() => { fetchConnectionStatuses(); mutateConnectionsCount(); }} />
                    )
                )}
            </div>

            {/* 2. STANDARD SOCIAL MEDIA SECTION (Switch List) */}
            <div className="divide-y divide-gray-200 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Social Media Accounts</h3>
                </div>

                {Object.entries(platformConfig).map(([platform, config]) => {
                    const isConnected = !!connections[platform]; 
                    const isDisabled = !isConnected && hasReachedLimit;

                    return (
                        <div key={platform} className="p-4 sm:flex sm:items-center sm:justify-between hover:bg-gray-50 transition">
                            <div>
                                <p className="text-base font-semibold text-gray-900">{config.name}</p>
                                {config.note && <p className="text-sm text-gray-500">{config.note}</p>}
                                {isDisabled && <p className="text-xs text-yellow-600 mt-1 font-medium">Upgrade to connect</p>}
                            </div>

                            <div className="mt-2 sm:mt-0 flex items-center space-x-4">
                                {platform === 'facebook' && isConnected && (
                                    <button onClick={() => setShowFacebookManager(prev => !prev)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">
                                        {showFacebookManager ? 'Hide Pages' : 'Manage Pages'}
                                    </button>
                                )}
                                {platform === 'instagram' && isConnected && (
                                    <button onClick={() => setShowInstagramManager(prev => !prev)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">
                                        {showInstagramManager ? 'Hide Accounts' : 'Manage Accounts'}
                                    </button>
                                )}

                                <Switch
                                    checked={isConnected}
                                    onChange={() => isConnected ? handleDisconnect(platform) : handleConnect(platform)}
                                    disabled={isDisabled}
                                    className={`${isConnected ? 'bg-blue-600' : 'bg-gray-200'} ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                >
                                    <span aria-hidden="true" className={`${isConnected ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                                </Switch>
                            </div>
                        </div>
                    );
                })}
            </div>

             {/* Modals/Managers */}
            {showFacebookManager && <div className="py-6 border-t mt-4"><h3 className="text-xl font-semibold mb-4">Manage Facebook Pages</h3><FacebookPageManager /></div>}
            {showInstagramManager && <div className="py-6 border-t mt-4"><h3 className="text-xl font-semibold mb-4">Manage Instagram Accounts</h3><InstagramAccountManager /></div>}
        </div>
    );
};

export default SocialConnectionsClient;