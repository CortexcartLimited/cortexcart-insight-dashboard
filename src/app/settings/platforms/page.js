// src/app/settings/platforms/page.js
'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

export default function PlatformsPage() {
    const [statuses, setStatuses] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [shopifyStore, setShopifyStore] = useState('');

    const fetchStatuses = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/platforms/status'); // This API can be reused
            if (!response.ok) throw new Error('Failed to fetch platform statuses.');
            setStatuses(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, []);
    
    const handleShopifyConnect = () => {
        if (!shopifyStore) {
            alert('Please enter your store name to connect.');
            return;
        }
        // Redirects to the backend route that starts the Shopify OAuth flow
        window.location.href = `/api/connect/shopify?shop=${shopifyStore}`;
    };

    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
        try {
            const response = await fetch(`/api/social/disconnect/${platform}`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to disconnect.');
            fetchStatuses(); // Refresh statuses to update the UI
        } catch (err) {
            setError(err.message); // Display error to the user
        }
    };

    const platformConfig = {
        shopify: { name: 'Shopify', description: 'Sync product data and link social performance to sales.' },
        mailchimp: { name: 'Mailchimp', description: 'Connect to sync audience and campaign data.', connectUrl: '/api/connect/mailchimp' },
        quickbooks: { name: 'QuickBooks', description: 'Connect to sync financial data for comprehensive reports.', connectUrl: '/api/connect/quickbooks' },
    };

    if (loading) return <Layout><p className="p-8">Loading platform connections...</p></Layout>;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">Platform Connections</h2>
                <Link href="/settings" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
                             Back to Settings Page
                            </Link>
                            </div>
                <p className="mt-1 text-sm text-gray-500 mb-4">Manage your e-commerce, marketing, and financial platform integrations.</p>
            
            
            {error && <p className="text-red-600 mb-4">{error}</p>}

            <div className="space-y-6 max-w-4xl">
                {/* Shopify Connection Card */}
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{platformConfig.shopify.name}</p>
                            <p className="text-sm text-gray-500">{platformConfig.shopify.description}</p>
                     
                                              </div>
                        {statuses.shopify?.isConnected ? (
                            <div className="flex items-center gap-x-4">
                                <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                                <button onClick={() => handleDisconnect('shopify')} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                            </div>
                        ) : (
                             <div className="flex items-center gap-x-2">
                                <input
                                    type="text"
                                    value={shopifyStore}
                                    onChange={(e) => setShopifyStore(e.target.value)}
                                    placeholder="your-store-name"
                                    className="px-3 py-1.5 border rounded-md text-sm"
                                />
                                <span className="text-sm text-gray-500">.myshopify.com</span>
                                <button onClick={handleShopifyConnect} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Connect</button>
                            </div>
                        )}
                    </div>
                     {statuses.shopify?.shopName && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                            Connected to: <span className="font-semibold">{statuses.shopify.shopName}</span>
                        </div>
                    )}
                </div>
<div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"> Not got a shopify store? get started today! <h3 id="1808670"><a rel="sponsored"
                                                                                                                                                                   href="https://shopify.pxf.io/c/6589611/1808670/13624" className='bg-blue-500 p-2 text-white rounded-md'>Shopify Free Trial</a>
</h3>
<img height="0" width="0" src="https://imp.pxf.io/i/6589611/1808670/13624" style={{position:'absolute', visibility:'hidden'}} border="0" alt="Shopify tracking pixel" />
</div>
                {/* Other Platform Connections (Mailchimp, QuickBooks) */}
                {Object.entries(platformConfig).filter(([key]) => key !== 'shopify').map(([key, config]) => (
                     <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                        <div>
                            <p className="font-semibold">{config.name}</p>
                            <p className="text-sm text-gray-500">{config.description}</p>
                        </div>
                        {statuses[key]?.isConnected ? (
                             <div className="flex items-center gap-x-4">
                                <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                                <button onClick={() => handleDisconnect(key)} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                            </div>
                        ) : (
                            <a href={config.connectUrl} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Connect</a>
                        )}
                    </div>
                ))}
            </div>
        </Layout>
    );
}