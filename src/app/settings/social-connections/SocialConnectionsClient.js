'use client';
import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { Cog6ToothIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FacebookPageManager from '@/app/components/social/FacebookPageManager';
import InstagramAccountManager from '@/app/components/social/InstagramAccountManager'; // Import the new component

const SocialConnectionsClient = () => {
    const [connections, setConnections] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFacebookManager, setShowFacebookManager] = useState(false);
    const [showInstagramManager, setShowInstagramManager] = useState(false); // State for Instagram manager

    const fetchConnections = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/social/connections/status');
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load connection statuses.');
            }
            
            const connectionStatuses = {};
            if (data.connections && Array.isArray(data.connections)) {
                data.connections.forEach(conn => {
                    connectionStatuses[conn.platform] = conn.status === 'connected';
                });
            }
            setConnections(connectionStatuses);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const handleConnect = (platform) => {
        window.location.href = `/api/connect/${platform}`;
    };

    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect your ${platform.charAt(0).toUpperCase() + platform.slice(1)} account?`)) {
            return;
        }
        try {
            const res = await fetch(`/api/social/disconnect/${platform}`, {
                method: 'POST',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to disconnect from ${platform}.`);
            }
            fetchConnections(); // Refresh statuses
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggle = (platform, isConnected) => {
        if (isConnected) {
            handleDisconnect(platform);
        } else {
            handleConnect(platform);
        }
    };
    
    if (loading) {
        return <div className="text-center p-8"><Cog6ToothIcon className="h-12 w-12 mx-auto text-gray-400 animate-spin" /><p className="mt-4">Loading...</p></div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex"><ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" /><div><p className="font-bold text-red-800">An Error Occurred</p><p className="mt-1 text-sm text-red-700">{error}</p></div></div>
            </div>
        );
    }

    const platformConfig = {
        x: { name: 'X (Twitter)' },
        facebook: { name: 'Facebook' },
        pinterest: { name: 'Pinterest' },
        instagram: { name: 'Instagram', note: 'Managed via your Facebook connection' },
        youtube: { name: 'YouTube' },
    };

    return (
        <div className="divide-y divide-gray-200">
            {Object.entries(platformConfig).map(([platform, config]) => (
                <div key={platform} className="py-4 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-lg font-semibold text-gray-900">{config.name}</p>
                        {config.note && <p className="text-sm text-gray-500">{config.note}</p>}
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center space-x-4">
                         {platform === 'facebook' && connections.facebook && (
                            <button
                                onClick={() => setShowFacebookManager(prev => !prev)}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md"
                            >
                                {showFacebookManager ? 'Hide Pages' : 'Manage Pages'}
                            </button>
                        )}
                        {platform === 'instagram' && connections.instagram && (
                             <button
                                onClick={() => setShowInstagramManager(prev => !prev)}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md"
                            >
                                {showInstagramManager ? 'Hide Accounts' : 'Manage Accounts'}
                            </button>
                        )}
                        <Switch
                            checked={connections[platform]}
                            onChange={() => handleToggle(platform, connections[platform])}
                            className={`${connections[platform] ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                        >
                            <span className={`${connections[platform] ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                        </Switch>
                    </div>
                </div>
            ))}
            {showFacebookManager && (
                <div className="py-6">
                    <FacebookPageManager />
                </div>
            )}
            {showInstagramManager && (
                <div className="py-6">
                    <InstagramAccountManager />
                </div>
            )}
        </div>
    );
};

export default SocialConnectionsClient;
