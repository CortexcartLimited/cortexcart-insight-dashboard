'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import FacebookPageManager from '@/app/components/social/FacebookPageManager'; // Import the new component

export default function SocialConnectionsClient() {
    // ... (keep all your existing state and useEffect logic)
    const [connections, setConnections] = useState({});
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ type: '', message: '' });
    const searchParams = useSearchParams();

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success) {
            const platform = success.split('_')[0];
            setNotification({ type: 'success', message: `Successfully connected your ${platform} account!` });
        }
        if (error) {
            setNotification({ type: 'error', message: 'Something went wrong. Please try connecting your account again.' });
        }

        const fetchConnections = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/social/connections/status');
                if (!response.ok) throw new Error('Failed to load connection status.');
                const data = await response.json();
                setConnections(data);
            } catch (err) {
                setNotification({ type: 'error', message: err.message });
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, [searchParams]);

    // This component remains the same
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
                    notification.type === 'success' 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-red-700 bg-red-100'
                }`}>
                    {notification.message}
                </div>
            )}

            <div className="p-6 border rounded-lg bg-white shadow-sm">
                <h3 className="font-semibold text-gray-800">Connect Your Accounts</h3>
                <div className="mt-4 space-y-4">
                    {loading ? <p>Loading connections...</p> : (
                        <>
                            {/* --- UPDATE THE FACEBOOK SECTION --- */}
                            <div>
                                <div className="flex justify-between items-center">
                                    <span>Facebook & Instagram</span>
                                    <ConnectionButton platform="facebook" connectUrl="/api/connect/facebook" />
                                </div>
                                {connections.facebook && <FacebookPageManager />}
                            </div>
                            {/* ---------------------------------- */}
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