// src/app/settings/social-connections/SocialConnectionsClient.js

'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Switch } from '@headlessui/react';
import FacebookPageManager from '@/app/components/social/FacebookPageManager';
import {Cog6ToothIcon, ExclamationTriangleIcon} from '@heroicons/react/24/outline';

const SocialConnectionsClient = () => {
    const { data: session } = useSession();
    const [connections, setConnections] = useState({
        x: false,
        facebook: false,
        pinterest: false,
        instagram: false,
        youtube: false,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFacebookManager, setShowFacebookManager] = useState(false);

    useEffect(() => {
        const fetchConnections = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch('/api/social/connections/status');
                const data = await res.json();
                if (!res.ok) {
                    // This is the important change to show detailed errors
                    throw new Error(data.details || data.error || 'Failed to load connection statuses.');
                }
                setConnections(data);
            } catch (err) {
                console.error("Caught error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchConnections();
    }, []);

    const handleConnect = (platform) => {
        window.location.href = `/api/connect/${platform}`;
    };

    if (loading) {
        return (
            <div className="text-center p-8">
                <Cog6ToothIcon className="h-12 w-12 mx-auto text-gray-400 animate-spin" />
                <p className="mt-4 text-lg font-medium text-gray-600">Loading your connections...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-bold text-red-800">Failed to load social connection data.</p>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const platformConfig = {
        x: { name: 'X (Twitter)' },
        facebook: { name: 'Facebook' },
        pinterest: { name: 'Pinterest' },
        instagram: { name: 'Instagram', note: 'Connected via Facebook' },
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
                                onClick={() => setShowFacebookManager(!showFacebookManager)}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md"
                            >
                                Manage Pages
                            </button>
                        )}
                        <Switch
                            checked={connections[platform]}
                            onChange={() => !connections[platform] && handleConnect(platform)}
                            className={`${connections[platform] ? 'bg-blue-600' : 'bg-gray-200'}
                              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                            <span className="sr-only">Use setting</span>
                            <span
                              aria-hidden="true"
                              className={`${connections[platform] ? 'translate-x-5' : 'translate-x-0'}
                                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </Switch>
                    </div>
                </div>
            ))}
            {showFacebookManager && (
                <div className="py-6">
                    <FacebookPageManager />
                </div>
            )}
        </div>
    );
};

export default SocialConnectionsClient;