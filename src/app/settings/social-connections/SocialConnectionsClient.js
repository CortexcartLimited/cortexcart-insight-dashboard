// src/app/settings/social-connections/SocialConnectionsClient.js

'use client';
import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { Cog6ToothIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FacebookPageManager from '@/app/components/social/FacebookPageManager';
import InstagramAccountManager from '@/app/components/social/InstagramAccountManager';
import useSWR from 'swr';
import Link from 'next/link'; // Import Link for the banner

const fetcher = (url) => fetch(url).then((res) => res.json());

const SocialConnectionsClient = () => {
    // --- State for Connection Statuses (Fetched) ---
    const [connections, setConnections] = useState({});
    const [statusLoading, setStatusLoading] = useState(true); // Renamed loading state
    const [statusError, setStatusError] = useState('');     // Renamed error state
    // --- End State for Connection Statuses ---

    const [showFacebookManager, setShowFacebookManager] = useState(false);
    const [showInstagramManager, setShowInstagramManager] = useState(false);

    // Fetch user's plan details (maxSocialConnections)
    const { data: planData, error: planError, isLoading: planLoading } = useSWR('/api/billing/my-plan', fetcher);
    // Fetch current number of connected platforms
    const { data: connectionsData, error: connectionsError, isLoading: connectionsLoading, mutate: mutateConnections } = useSWR('/api/user/social-connections', fetcher);

    const userPlan = planData?.planDetails;
    const maxConnections = userPlan?.limits?.maxSocialConnections || 0;
    const currentConnections = connectionsData?.currentConnections || 0;

    // Combine loading states
    const isLoading = planLoading || connectionsLoading || statusLoading;
    // Combine error states
    const isError = planError || connectionsError || statusError;

    // Determine if the user has reached their limit for *new* connections
    const hasReachedLimit = currentConnections >= maxConnections;

    // Fetch initial connection statuses
    const fetchStatuses = useCallback(async () => {
        setStatusLoading(true);
        setStatusError('');
        try {
            const res = await fetch('/api/social/connections/status'); //
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
            setStatusError(err.message);
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatuses();
    }, [fetchStatuses]);

    // Handle initiating a connection (Redirect)
    const handleConnect = (platform) => {
        // Double check limit just before redirecting
        if (hasReachedLimit) {
             alert(`You have reached your limit of ${maxConnections} social platforms. Please upgrade your plan to connect more.`);
             return;
        }
        console.log(`Redirecting to connect ${platform}`);
        window.location.href = `/api/connect/${platform}`; // Redirect to backend route to start OAuth flow
    };

    // Handle disconnecting via API call
    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect your ${platform.charAt(0).toUpperCase() + platform.slice(1)} account?`)) {
            return;
        }
        setStatusError(''); // Clear previous errors
        try {
            const res = await fetch(`/api/social/disconnect/${platform}`, { ///route.js]
                method: 'POST',
            });
            const data = await res.json(); // Read body regardless of status
            if (!res.ok) {
                throw new Error(data.error || `Failed to disconnect from ${platform}. Status: ${res.status}`);
            }
            // --- Refresh both status and count on success ---
            await fetchStatuses(); // Refresh individual statuses
            await mutateConnections(); // Re-fetch the count
            // --- End Refresh ---
        } catch (err) {
            console.error(`Disconnect error for ${platform}:`, err);
            setStatusError(err.message); // Show error to user
        }
    };

    // Decides whether to call connect or disconnect based on current state
    const handleToggleAction = (platform, isCurrentlyConnected) => {
         // Prevent enabling if limit is reached
        if (!isCurrentlyConnected && hasReachedLimit) {
             alert(`You have reached your limit of ${maxConnections} social platforms. Please upgrade your plan to connect more.`);
             return; // Explicitly stop here
        }

        if (isCurrentlyConnected) {
            handleDisconnect(platform);
        } else {
            handleConnect(platform); // This already checks the limit again before redirecting
        }
    };


    if (isLoading) {
        return <div className="text-center p-8"><Cog6ToothIcon className="h-12 w-12 mx-auto text-gray-400 animate-spin" /><p className="mt-4">Loading...</p></div>;
    }

    // Handle combined error state
    if (isError) {
        // Prioritize specific errors if available
        const errorMessage = statusError || connectionsError?.message || planError?.message || 'An unexpected error occurred while loading settings.';
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex"><ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" /><div><p className="font-bold text-red-800">An Error Occurred</p><p className="mt-1 text-sm text-red-700">{errorMessage}</p></div></div>
            </div>
        );
    }

    // Define platform display configuration
    const platformConfig = {
        x: { name: 'X (Twitter)' },
        facebook: { name: 'Facebook' },
        pinterest: { name: 'Pinterest' },
        instagram: { name: 'Instagram', note: 'Managed via your Facebook connection' },
        youtube: { name: 'YouTube' },
        // Add others like Mailchimp if managed here
        // mailchimp: { name: 'Mailchimp' },
    };


    return (
        <div className="divide-y divide-gray-200">
            {/* Limit Banner */}
            {hasReachedLimit && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                    <p className="font-bold">{userPlan?.name || 'Current Plan'} Limit:</p>
                    <p>You have connected {currentConnections} out of {maxConnections} allowed social platforms. To connect more, please <Link href="/upgrade-plans" className="underline font-semibold">upgrade your plan</Link>.</p>
                </div>
            )}

            {/* Platform List */}
            {Object.entries(platformConfig).map(([platform, config]) => {
                const isConnected = !!connections[platform]; // Get current status from fetched state
                // Determine if the toggle should be disabled for *enabling*
                const isDisabled = !isConnected && hasReachedLimit;

                return (
                    <div key={platform} className="py-4 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-lg font-semibold text-gray-900">{config.name}</p>
                            {config.note && <p className="text-sm text-gray-500">{config.note}</p>}
                            {/* Show 'Upgrade' message next to disabled toggles */}
                            {isDisabled && <p className="text-sm text-yellow-600 mt-1">Upgrade to connect</p>}
                        </div>
                        <div className="mt-2 sm:mt-0 flex items-center space-x-4">
                            {/* Manage Buttons */}
                            {platform === 'facebook' && isConnected && (
                                <button
                                    onClick={() => setShowFacebookManager(prev => !prev)}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md"
                                >
                                    {showFacebookManager ? 'Hide Pages' : 'Manage Pages'}
                                </button>
                            )}
                            {platform === 'instagram' && isConnected && (
                                <button
                                    onClick={() => setShowInstagramManager(prev => !prev)}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md"
                                >
                                    {showInstagramManager ? 'Hide Accounts' : 'Manage Accounts'}
                                </button>
                            )}

                            {/* Toggle Switch */}
                            <Switch
                                checked={isConnected}
                                onChange={() => handleToggleAction(platform, isConnected)}
                                disabled={isDisabled} // *** ADDED DISABLED PROP ***
                                className={`${
                                    isConnected ? 'bg-blue-600' : 'bg-gray-200'
                                } ${
                                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer' // Style disabled state
                                } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                            >
                                <span className={`${
                                    isConnected ? 'translate-x-5' : 'translate-x-0'
                                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                />
                            </Switch>
                        </div>
                    </div>
                );
             })}

             {/* Modals/Managers */}
            {showFacebookManager && (
                <div className="py-6 border-t mt-4">
                    <h3 className="text-xl font-semibold mb-4">Manage Facebook Pages</h3>
                    <FacebookPageManager />
                </div>
            )}
            {showInstagramManager && (
                <div className="py-6 border-t mt-4">
                     <h3 className="text-xl font-semibold mb-4">Manage Instagram Accounts</h3>
                    <InstagramAccountManager />
                </div>
            )}
        </div>
    );
};

export default SocialConnectionsClient;