// src/app/settings/social-connections/SocialConnectionsClient.js

'use client';
import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { Cog6ToothIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FacebookPageManager from '@/app/components/social/FacebookPageManager';
import InstagramAccountManager from '@/app/components/social/InstagramAccountManager';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url) => fetch(url).then((res) => res.json());

const SocialConnectionsClient = () => {
<<<<<<< Updated upstream
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

    // --- !!! THIS IS THE FIX !!! ---
    // planData *is* the plan object, no .planDetails is needed.
    const userPlan = planData; 
    // --- !!! END OF FIX !!! ---
    
    const maxConnections = userPlan?.limits?.maxSocialConnections ?? 0; // Use nullish coalescing for default
    const currentConnections = connectionsCountData?.currentConnections ?? 0;

    // Combine loading and error states
    const isLoading = planLoading || connectionsLoading || statusLoading;
    const combinedError = planError || connectionsCountError || statusError;
=======
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

    const userPlan = planData?
    const maxConnections = userPlan?.limits?.maxSocialConnections || 0;
    const currentConnections = connectionsData?.currentConnections || 0;

    // Combine loading states
    const isLoading = planLoading || connectionsLoading || statusLoading;
    // Combine error states
    const isError = planError || connectionsError || statusError;
>>>>>>> Stashed changes

    // Determine if the user has reached their limit for *new* connections
    const hasReachedLimit = currentConnections >= maxConnections;

<<<<<<< Updated upstream
    // Fetches the ON/OFF status for each platform
    const fetchConnectionStatuses = useCallback(async () => {
=======
    // Fetch initial connection statuses
    const fetchStatuses = useCallback(async () => {
>>>>>>> Stashed changes
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
                    // Ensure platform names match keys used elsewhere (e.g., 'x', 'facebook')
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
<<<<<<< Updated upstream
        fetchConnectionStatuses();
    }, [fetchConnectionStatuses]);

    // Function to initiate the connection flow (OAuth redirect)
    const handleConnect = (platform) => {
        // Final check before redirecting
        if (hasReachedLimit) {
             alert(`You have reached your limit of ${maxConnections} social platforms. Please upgrade your plan.`);
             return;
        }
        console.log(`Redirecting to connect ${platform}...`);
        // Redirect to the backend route that starts the OAuth flow for the specific platform
        window.location.href = `/api/connect/${platform}`; // e.g., /api/connect/x
    };

    // Function to call the disconnect API endpoint
=======
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
>>>>>>> Stashed changes
    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect your ${platform.charAt(0).toUpperCase() + platform.slice(1)} account?`)) {
            return;
        }
<<<<<<< Updated upstream
        setStatusError(''); // Clear previous errors before trying
=======
        setStatusError(''); // Clear previous errors
>>>>>>> Stashed changes
        try {
            const res = await fetch(`/api/social/disconnect/${platform}`, { ///route.js]
                method: 'POST',
            });
<<<<<<< Updated upstream
            const data = await res.json(); // Always try to parse JSON
=======
            const data = await res.json(); // Read body regardless of status
>>>>>>> Stashed changes
            if (!res.ok) {
                throw new Error(data.error || `Failed to disconnect from ${platform}. Status: ${res.status}`);
            }
<<<<<<< Updated upstream
            console.log(`Successfully disconnected ${platform}`);
            // --- Refresh statuses and count ---
            await fetchConnectionStatuses(); // Fetch individual on/off states
            await mutateConnectionsCount(); // Re-fetch the total count
            // --- End Refresh ---
        } catch (err) {
            console.error(`Disconnect error for ${platform}:`, err);
            setStatusError(err.message); // Display error to the user
        }
    };

    // --- Main handler called by the Switch's onChange ---
    const handleToggleChange = (platform, isCurrentlyConnected) => {
        if (isCurrentlyConnected) {
            // If it's currently ON, the action is to disconnect
            handleDisconnect(platform);
        } else {
            // If it's currently OFF, the action is to connect (limit check happens in handleConnect)
            handleConnect(platform);
        }
    };
    // --- End Main Handler ---

    // --- Loading and Error States ---
=======
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


>>>>>>> Stashed changes
    if (isLoading) {
        return <div className="text-center p-8"><Cog6ToothIcon className="h-12 w-12 mx-auto text-gray-400 animate-spin" /><p className="mt-4">Loading...</p></div>;
    }

<<<<<<< Updated upstream
    if (combinedError) {
        const errorMessage = statusError || connectionsCountError?.message || planError?.message || 'An unexpected error occurred.';
=======
    // Handle combined error state
    if (isError) {
        // Prioritize specific errors if available
        const errorMessage = statusError || connectionsError?.message || planError?.message || 'An unexpected error occurred while loading settings.';
>>>>>>> Stashed changes
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex"><ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" /><div><p className="font-bold text-red-800">An Error Occurred</p><p className="mt-1 text-sm text-red-700">{errorMessage}</p></div></div>
            </div>
        );
    }
    // --- End Loading and Error States ---

<<<<<<< Updated upstream
    // Configuration for displaying platforms
=======
    // Define platform display configuration
>>>>>>> Stashed changes
    const platformConfig = {
        x: { name: 'X (Twitter)' },
        facebook: { name: 'Facebook' },
        pinterest: { name: 'Pinterest' },
        instagram: { name: 'Instagram', note: 'Managed via your Facebook connection' },
        youtube: { name: 'YouTube' },
<<<<<<< Updated upstream
        // Add others if needed
       
=======
        // Add others like Mailchimp if managed here
        // mailchimp: { name: 'Mailchimp' },
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                // Determine if the toggle should be disabled (only when trying to enable *new* connection at limit)
                const isDisabled = !isConnected && hasReachedLimit;

                // --- Check your browser console for these logs! ---
                console.log(`Platform: ${platform}, isConnected: ${isConnected}, hasReachedLimit: ${hasReachedLimit}, calculated isDisabled: ${isDisabled}`);
                // --- End Logs ---

                return (
                    <div key={platform} className="py-4 sm:flex sm:items-center sm:justify-between">
                        {/* Platform Name & Note */}
                        <div>
                            <p className="text-lg font-semibold text-gray-900">{config.name}</p>
                            {config.note && <p className="text-sm text-gray-500">{config.note}</p>}
                            {isDisabled && <p className="text-sm text-yellow-600 mt-1">Upgrade to connect</p>}
                        </div>

                        {/* Buttons & Toggle */}
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                                onChange={() => handleToggleChange(platform, isConnected)} // Use the unified handler
                                disabled={isDisabled} // Disable based on logic
                                className={`${
                                    isConnected ? 'bg-blue-600' : 'bg-gray-200'
                                } ${
                                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer' // Add disabled styles
                                } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`} // Added focus rings for accessibility
                            >
                                <span className="sr-only">Enable {config.name}</span> {/* Accessibility */}
                                <span
                                    aria-hidden="true"
                                    className={`${
=======
                                onChange={() => handleToggleAction(platform, isConnected)}
                                disabled={isDisabled} // *** ADDED DISABLED PROP ***
                                className={`${
                                    isConnected ? 'bg-blue-600' : 'bg-gray-200'
                                } ${
                                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer' // Style disabled state
                                } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                            >
                                <span className={`${
>>>>>>> Stashed changes
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