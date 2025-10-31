// src/app/settings/platforms/page.js
'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import useSWR from 'swr'; // <-- NEW IMPORT

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PlatformsPage() {
    const [shopifyStore, setShopifyStore] = useState('');
    
    // --- SWR Data Fetching ---
    const { data: planData, error: planError } = useSWR('/api/billing/my-plan', fetcher);
    const { data: countData, error: countError } = useSWR('/api/user/platform-connections', fetcher);
    const { data: statusesData, error: statusError } = useSWR('/api/platforms/status', fetcher);
    // --- End SWR ---
    
    // Derive state from SWR data
    const statuses = statusesData || {};
    const isLoading = !planData && !countData && !statusesData;
    const error = planError || countError || statusError;

    // --- NEW: Plan Limit Logic ---
    const userPlan = planData;
    const maxPlatforms = userPlan?.limits?.maxPlatformIntegrations ?? 0;
    const currentPlatforms = countData?.currentConnections ?? 0;

    // Determine if the user has reached their limit for *new* connections
    const hasReachedLimit = (maxPlatforms > 0) && (currentPlatforms >= maxPlatforms);
    // --- END: Plan Limit Logic ---

    
    // --- NEW: Unified Connect Handler ---
    const handleConnect = (platform) => {
        // 1. Check limit first
        if (hasReachedLimit) {
            alert(`You have reached your limit of ${maxPlatforms} platform integrations. Please upgrade your plan.`);
            return;
        }

        // 2. Proceed with connection
        if (platform === 'shopify') {
            if (!shopifyStore) {
                alert('Please enter your store name to connect.');
                return;
            }
            window.location.href = `/api/connect/shopify?shop=${shopifyStore}`;
        } else {
            // This works for Mailchimp, QuickBooks, etc.
            window.location.href = `/api/connect/${platform}`;
        }
    };
    // --- END: Unified Connect Handler ---

    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
        try {
            const response = await fetch(`/api/social/disconnect/${platform}`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to disconnect.');
            // TODO: We need to mutate the SWR data here, but for now, a full reload works.
            window.location.reload(); 
        } catch (err) {
            alert(err.message); // Display error to the user
        }
    };

    const platformConfig = {
        shopify: { name: 'Shopify', description: 'Sync product data and link social performance to sales.' },
        mailchimp: { name: 'Mailchimp', description: 'Connect to sync audience and campaign data.' },
        quickbooks: { name: 'QuickBooks', description: 'Connect to sync financial data for comprehensive reports.' },
    };

    if (isLoading) return <Layout><p className="p-8">Loading platform connections...</p></Layout>;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">Platform Connections</h2>
                <Link href="/settings" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
                    Back to Settings Page
                </Link>
            </div>
            <p className="mt-1 text-sm text-gray-500 mb-4">Manage your e-commerce, marketing, and financial platform integrations.</p>
            
            {error && <p className="text-red-600 mb-4">{error.message}</p>}

            {/* --- NEW: Limit Banner --- */}
            {hasReachedLimit && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 max-w-4xl" role="alert">
                    <p className="font-bold">{userPlan?.name || 'Current Plan'} Limit:</p>
                    <p>You have connected {currentPlatforms} out of {maxPlatforms} allowed platforms. To connect more, please <Link href="/upgrade-plans" className="underline font-semibold">upgrade your plan</Link>.</p>
                </div>
            )}
            {/* --- END: Limit Banner --- */}

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
                                {/* --- NEW: Disabled logic --- */}
                                {hasReachedLimit ? (
                                    <p className="text-sm text-yellow-600 font-medium">Upgrade to connect</p>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={shopifyStore}
                                            onChange={(e) => setShopifyStore(e.target.value)}
                                            placeholder="your-store-name"
                                            className="px-3 py-1.5 border rounded-md text-sm"
                                        />
                                        <span className="text-sm text-gray-500">.myshopify.com</span>
                                        <button onClick={() => handleConnect('shopify')} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Connect</button>
                                    </>
                                )}
                             </div>
                        )}
                    </div>
                     {statuses.shopify?.shopName && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                            Connected to: <span className="font-semibold">{statuses.shopify.shopName}</span>
                        </div>
                    )}
                </div>
                
                {/* Shopify Affiliate Banner */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"> Not got a shopify store? get started today! <h3 id="1808670"><a rel="sponsored"
                    href="https://shopify.pxf.io/c/6589611/1808670/13624" className='bg-blue-500 p-2 text-white rounded-md'>Shopify Free Trial</a>
                </h3>
                <img height="0" width="0" src="https://imp.pxf.io/i/6589611/1808670/13624" style={{position:'absolute', visibility:'hidden'}} border="0" alt="Shopify tracking pixel" />
                </div>

                {/* Other Platform Connections (Mailchimp, QuickBooks) */}
                {Object.entries(platformConfig).filter(([key]) => key !== 'shopify').map(([key, config]) => {
                    
                    // --- NEW: Disabled logic for these buttons ---
                    const isConnected = statuses[key]?.isConnected;
                    const isDisabled = !isConnected && hasReachedLimit;
                    
                    return (
                     <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                        <div>
                            <p className="font-semibold">{config.name}</p>
                            <p className="text-sm text-gray-500">{config.description}</p>
                        </div>
                        {isConnected ? (
                             <div className="flex items-center gap-x-4">
                                <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                                <button onClick={() => handleDisconnect(key)} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                            </div>
                        ) : (
                            // --- CHANGED: <a> tag to <button> ---
                            <button 
                                onClick={() => handleConnect(key)} 
                                disabled={isDisabled}
                                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                            >
                                Connect
                            </button>
                        )}
                         {/* --- NEW: Show upgrade message --- */}
                         {isDisabled && <p className="text-sm text-yellow-600 font-medium">Upgrade to connect</p>}
                    </div>
                )})}
            </div>
        </Layout>
    );
}