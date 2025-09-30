// src/app/settings/social-connections/SocialConnectionsClient.js

'use client';
import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { Cog6ToothIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FacebookPageManager from '@/app/components/social/FacebookPageManager';

const SocialConnectionsClient = () => {
    console.log('[DEBUG] 1. Component rendering starts.');

    const [connections, setConnections] = useState(null); // Start with null to track initial load
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFacebookManager, setShowFacebookManager] = useState(false);

    const fetchConnections = useCallback(async () => {
        console.log('[DEBUG] 2. useEffect triggered, starting to fetch connection statuses.');
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/social/connections/status');
            const data = await res.json();
            console.log('[DEBUG] 3. Received data from /status API:', data);

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load connection statuses.');
            }
            setConnections(data);
            console.log('[DEBUG] 4. State updated with new connections data.');
        } catch (err) {
            console.error('[DEBUG] 5. CAUGHT AN ERROR:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            console.log('[DEBUG] 6. Fetch process finished.');
        }
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const handleDisconnect = async (platform) => { /* ... disconnect logic ... */ };
    const handleConnect = (platform) => { /* ... connect logic ... */ };
    const handleToggle = (platform, isConnected) => { /* ... toggle logic ... */ };
    
    if (loading) {
        console.log('[DEBUG] Rendering: Loading state.');
        return <div className="text-center p-8"><Cog6ToothIcon className="h-12 w-12 mx-auto text-gray-400 animate-spin" /><p className="mt-4">Loading...</p></div>;
    }

    if (error) {
        console.log('[DEBUG] Rendering: Error state.', { error });
        return <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md"><div className="flex"><ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" /><div><p className="font-bold text-red-800">An Error Occurred</p><p className="mt-1 text-sm text-red-700">{error}</p></div></div></div>;
    }

    if (!connections) {
        console.log('[DEBUG] Rendering: No connections data yet, rendering nothing.');
        // This prevents a crash if the API call fails before setting connections
        return null;
    }

    console.log('[DEBUG] Rendering: Main content with connections:', connections);
    const platformConfig = { /* ... platform config ... */ };

    return (
        <div className="divide-y divide-gray-200">
            {Object.entries(platformConfig).map(([platform, config]) => {
                const isConnected = connections[platform];
                console.log(`[DEBUG] Rendering platform: ${platform}, connected: ${isConnected}`);
                if (typeof isConnected !== 'boolean') {
                    console.error(`[DEBUG] CRITICAL: The connection status for '${platform}' is not a boolean! It is:`, isConnected);
                }
                return (
                    <div key={platform} className="py-4 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-lg font-semibold text-gray-900">{config.name}</p>
                            {config.note && <p className="text-sm text-gray-500">{config.note}</p>}
                        </div>
                        <div className="mt-2 sm:mt-0 flex items-center space-x-4">
                            {platform === 'facebook' && isConnected && (
                                <button onClick={() => setShowFacebookManager(prev => !prev)} className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md">
                                    {showFacebookManager ? 'Hide Pages' : 'Manage Pages'}
                                </button>
                            )}
                            <Switch
                                checked={!!isConnected} // Use !! to ensure it's always a boolean
                                onChange={() => handleToggle(platform, isConnected)}
                                className={`${isConnected ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                            >
                                <span className={`${isConnected ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                            </Switch>
                        </div>
                    </div>
                );
            })}
            {showFacebookManager && <div className="py-6"><FacebookPageManager /></div>}
        </div>
    );
};

export default SocialConnectionsClient;