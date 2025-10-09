// src/app/components/QuickBooksConnect.jsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button'; // Assuming you have a button component
import { CheckCircleIcon } from '@heroicons/react/24/solid';
export default function QuickBooksConnect() {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check connection status when the component loads
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch('/api/quickbooks/status');
                const data = await response.json();
                if (response.ok) {
                    setIsConnected(data.isConnected);
                }
            } catch (error) {
                console.error('Failed to check QuickBooks connection status', error);
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus();
    }, []);

    // Function to handle connecting to QuickBooks
    const handleConnect = () => {
        // Redirect the user to our backend route that starts the OAuth flow
        window.location.href = '/api/connect/quickbooks';
    };

    // Function to handle disconnecting
    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect from QuickBooks?')) {
            return;
        }

        try {
            const response = await fetch('/api/social/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ platform: 'quickbooks' }),
            });

            if (response.ok) {
                setIsConnected(false);
                alert('Successfully disconnected from QuickBooks.');
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to disconnect');
            }
        } catch (error) {
            console.error('Disconnect failed:', error);
            alert(`Error: ${error.message}`);
        }
    };

    if (isLoading) {
        return <Button disabled>Loading...</Button>;
    }

    return (
           <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">QuickBooks</p>
                        <p className="text-sm text-gray-500">Connect your Quickbooks account to sync sales and purchase data.</p>
                    </div>
                    {/* This will show a "Connected" status or a "Connect" button */}
 {isConnected ? (
                        <div className="flex items-center gap-x-4">
                            <span className="flex items-center text-sm font-medium text-green-600">
                                <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                                Connected
                            </span>
                            <button 
                                onClick={() => handleDisconnect('quickbooks')} 
                                className="text-sm font-medium text-red-600 hover:text-red-800"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <a 
                            href="/api/connect/quickbooks" 
                            className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm hover:bg-blue-400"
                        >
                            Connect Quickbooks
                        </a>
                    )}
                </div>
            </div>
              );
}