'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Layout from '@/app/components/Layout';
import SettingsTabs from '@/app/components/SettingsTabs';
import { CheckCircleIcon, ClipboardDocumentIcon, Cog } from '@heroicons/react/24/solid';
import AlertBanner from '@/app/components/AlertBanner';
import { useRouter, useSearchParams } from "next/navigation";
import QuickBooksConnect from '@/app/components/QuickBooksConnect';
import Image from 'next/image';
import Link from 'next/link';


const tabs = [
    //{ name: 'General', href: '#' },
    { name: 'Integrations (GA4)', href: '#' },
    { name: 'Social Connections', href: '#' },
    { name: 'Platforms', href: '#' },
    { name: 'Widget Code', href: '#' },
    //{ name: 'Billing', href: '#' },
    //{ name: 'Danger Zone', href: '#' },
];

// --- General Settings Component ---
const GeneralTabContent = () => {
    const [siteName, setSiteName] = useState('');
    const [siteUrl, setSiteUrl] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [formMessage, setFormMessage] = useState({ text: '', isError: false });
    const [isSaving, setIsSaving] = useState(false);
    const currencyOptions = [
        { code: 'USD', symbol: '$', name: 'United States Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
    ];

    useEffect(() => {
        async function fetchSettings() {
            const res = await fetch('/api/site-settings');
            if (res.ok) {
                const data = await res.json();
                setSiteName(data.site_name || '');
                setSiteUrl(data.site_url || '');
                setFullName(data.full_name || '');
                setEmail(data.email || '');
                setAddress(data.address || '');
                setPostalCode(data.postal_code || '');
                setCurrency(data.currency || 'USD');
            }
        }
        fetchSettings();
    }, []);


    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setFormMessage({ text: '', isError: false });
        try {
            const res = await fetch('/api/site-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteName, siteUrl, fullName, email, address, postalCode, currency })
            });
            if (!res.ok) throw new Error((await res.json()).message);
            setFormMessage({ text: 'Settings saved successfully!', isError: false });
        } catch (error) {
            setFormMessage({ text: error.message, isError: true });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <h3 className="text-lg font-medium leading-6 text-gray-900">General Information</h3>
            <form onSubmit={handleSaveSettings} className="mt-6 space-y-6">
                <div>
                    <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">Site Name</label>
                    <input type="text" id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700">Site URL</label>
                    <input type="url" id="siteUrl" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal/Zip Code</label>
                    <input type="text" id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
                    <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {currencyOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.name} ({opt.code})</option>)}
                    </select>
                </div>
                <div className="flex items-center justify-between">
                    <button type="submit" disabled={isSaving} className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                    {formMessage.text && <p className={`text-sm ${formMessage.isError ? 'text-red-600' : 'text-green-600'}`}>{formMessage.text}</p>}
                </div>
            </form>
        </div>
    );
};

// --- Integrations Settings Component ---
const IntegrationsTabContent = () => {
    const [ga4PropertyId, setGa4PropertyId] = useState('');
    const [formMessage, setFormMessage] = useState({ text: '', isError: false });
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        async function fetchGA4Settings() {
            const res = await fetch('/api/ga4-connections');
            if (res.ok) setGa4PropertyId((await res.json()).ga4_property_id || '');
        }
        fetchGA4Settings();
    }, []);

    const handleSaveGA4Settings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setFormMessage({ text: '', isError: false });
        try {
            const res = await fetch('/api/ga4-connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ga4PropertyId })
            });
            if (!res.ok) throw new Error((await res.json()).message);
            setFormMessage({ text: 'GA4 settings saved successfully!', isError: false });
        } catch (error) {
            setFormMessage({ text: error.message, isError: true });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Google Analytics Integration</h3>
                <form onSubmit={handleSaveGA4Settings} className="mt-6 space-y-6">
                    <div>
                        <label htmlFor="ga4PropertyId" className="block text-sm font-medium text-gray-700">GA4 Property ID</label>
                        <input type="text" id="ga4PropertyId" value={ga4PropertyId} onChange={(e) => setGa4PropertyId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., 123456789" />
                    </div>
                    <div className="flex items-center justify-between">
                        <button type="submit" disabled={isSaving} className="inline-flex justify-center py-2 px-4 border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">{isSaving ? 'Saving...' : 'Save GA4 Settings'}</button>
                        {formMessage.text && <p className={`text-sm ${formMessage.isError ? 'text-red-600' : 'text-green-600'}`}>{formMessage.text}</p>}
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Social Connections Component ---
const SocialConnectionsTabContent = ({ connectionStatus, fetchConnections, setAlert }) => {
    const [activePageId, setActivePageId] = useState(null); 
    const [facebookPages, setFacebookPages] = useState([]);
    const [instagramAccounts, setInstagramAccounts] = useState([]);
    const [activeInstagramId, setActiveInstagramId] = useState(null);

    useEffect(() => {
        const fetchPageData = async () => {
            if (connectionStatus.facebook) {
                try {
                    const [pagesRes, igRes, activePageRes, activeIgRes] = await Promise.all([
                        fetch('/api/social/facebook/pages'),
                        fetch('/api/social/instagram/accounts'),
                        fetch('/api/social/facebook/active-page'),
                        fetch('/api/social/instagram/active-accounts')
                    ]);

                    if (pagesRes.ok) setFacebookPages(await pagesRes.json());
                    if (igRes.ok) setInstagramAccounts(await igRes.json());
                    if (activePageRes.ok) setActivePageId((await activePageRes.json()).active_facebook_page_id);
                    if (activeIgRes.ok) setActiveInstagramId((await activeIgRes.json()).active_instagram_account_id);
                } catch (err) {
                    console.error("Failed to fetch connection data:", err);
                    setAlert({ show: true, message: err.message, type: 'danger' });
                }
            } else {
                setFacebookPages([]);
                setInstagramAccounts([]);
                setActiveInstagramId(null);
                setActivePageId(null);
            }
        };
        fetchPageData();
    }, [connectionStatus, setAlert]);

const [platformToDisconnect, setPlatformToDisconnect] = useState(null);
const [confirmationText, setConfirmationText] = useState('');

const openDisconnectModal = (platform) => {
    setPlatformToDisconnect(platform);
};

const closeDisconnectModal = () => {
    setPlatformToDisconnect(null);
    setConfirmationText('');
};
const handleDisconnect = async (platform) => {
    // Check if the confirmation text is correct
    if (confirmationText.toLowerCase() !== 'disconnect') {
        setDisconnectError('Please type "disconnect" to confirm.');
        return;
    }

    try {
        const response = await fetch(`/api/social/disconnect/${platform}`, {
            method: 'POST',
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Failed to disconnect ${platform}.`);
        }
        
        // Refresh the connection statuses after disconnecting
        fetchStatuses();
        closeDisconnectModal();

    } catch (err) {
        setDisconnectError(err.message);
    }
};

    const handleConnectInstagram = async (accountId) => {
        setAlert({ show: false, message: '', type: 'info' });
        try {
            const res = await fetch('/api/social/instagram/connect-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: accountId })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to connect Instagram account.');
            setActiveInstagramId(accountId);
            setAlert({ show: true, message: `Instagram account connected successfully!`, type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: error.message, type: 'danger' });
        }
    };
    
    const handleConnectPage = async (pageId) => {
        setAlert({ show: false, message: '', type: 'info' });
        try {
            const res = await fetch('/api/social/facebook/connect-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to connect page.');
            setActivePageId(pageId);
            setAlert({ show: true, message: `Page connected successfully!`, type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: error.message, type: 'danger' });
        }
    };

    return (
        <div className="max-w-3xl space-y-4">
           
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Social Connections</h3>
                <p className="mt-1 text-sm text-gray-500">Connect your social media accounts to enable posting and analytics.</p>
                
                <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                         <div>
                            <p className="font-semibold">Facebook / Instagram</p>
                            <p className="text-sm text-gray-500">Connect your Facebook/Instagram account to manage your pages and posts.</p>
                        </div>
                        {connectionStatus.facebook ? (
                          <div className="flex items-center gap-x-4">
                            <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                            <button onClick={() => handleDisconnect('facebook')} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                        </div>
                        ) : (
                            <a href="/api/connect/facebook" className="px-3 py-1 text-sm bg-blue-600 text-white border border-transparent rounded-md hover:bg-blue-700">
                                Connect to Facebook
                            </a>
                        )}
                    </div>
                      {connectionStatus.facebook && (
                        <>
                            <div className="mt-4 pt-4 border-t">
                                <h4 className="text-base font-medium text-gray-800">Your Facebook Pages</h4>
                                {facebookPages.length > 0 ? (
                                    <ul className="mt-2 space-y-2">
                                        {facebookPages.map(page => (
                                            <li key={page.page_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                                <div className="flex items-center">
                                                    {/* ✅ FIX: Uses the now-correct 'profile_picture' field */}
                                                    {page.picture_url && <Image src={page.picture_url} alt={page.page_name} className="h-8 w-8 rounded-full mr-3" width={32} height={32}/>}
                                                    <span className="text-sm font-medium text-gray-700">{page.page_name}</span>
                                                </div>
                                                {page.page_id === activePageId ? (
                                                    <span className="flex items-center text-sm font-medium text-green-600">
                                                        <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <button onClick={() => handleConnectPage(page.page_id)} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100">
                                                        Connect
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500 mt-2">No pages found.</p>
                                )}
                            </div>
                                <div className="mt-4 pt-4 border-t">
                                <h4 className="text-base font-medium text-gray-800">Your Instagram Accounts</h4>
                                {instagramAccounts.length > 0 ? (
                                <ul className="mt-2 space-y-2">
                                    {instagramAccounts.map(acc => (
                                        <li key={acc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                            <div className="flex items-center">
                                                {acc.profile_picture_url && <Image src={acc.profile_picture_url} alt={acc.username} className="h-8 w-8 rounded-full mr-3" width={32} height={32} />}
                                                <span className="text-sm font-medium text-gray-700">@{acc.username}</span>
                                            </div>
                                            {acc.id === activeInstagramId ? (
                                                <span className="flex items-center text-sm font-medium text-green-600">
                                                    <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                                                    Active
                                                </span>
                                            ) : (
                                                <button onClick={() => handleConnectInstagram(acc.id)} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100">
                                                    Connect
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                ) : <p className="text-sm text-gray-500 mt-2">No Instagram Business accounts found. Please ensure you have connected your account on facebook business page.</p>}
                            </div>
                        </>
                    )}
                </div>
                 <div className="mt-4 p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-semibold">X (Twitter)</p>
                        <p className="text-sm text-gray-500">Connect your X account to allow posting and scheduling.</p>
                    </div>
                    {connectionStatus.x ? (
                        <div className="flex items-center gap-x-4">
                            <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                            <button onClick={() => handleDisconnect('x')} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                        </div>
                    ) : (
                    <a href="/api/connect/twitter" className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700">Connect X/Twitter</a>
                      )}
                </div>

                <div className="mt-4 p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-semibold">YouTube</p>
                        <p className="text-sm text-gray-500">Connect your YouTube channel to sync videos and analytics.</p>
                    </div>
                    {connectionStatus.youtube ? (
                        <div className="flex items-center gap-x-4">
                            <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                            <button onClick={() => handleDisconnect('youtube')} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                        </div>
                    ) : (
                        <a href="/api/connect/youtube" className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700" aria-disabled>Connect YouTube</a>
                    )}
                </div>

                <div className="mt-4 p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Pinterest</p>
                        <p className="text-sm text-gray-500">Connect your Pinterest account to pin content and view analytics.</p>
                    </div>
                    {connectionStatus.pinterest ? (
                        <div className="flex items-center gap-x-4">
                            <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                            <button onClick={() => handleDisconnect('pinterest')} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                        </div>
                    ) : (
                        <a href="/api/connect/pinterest" className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700">Connect to Pinterest</a>
                    )}
                </div>
          {platformToDisconnect && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold">Disconnect {platformToDisconnect}?</h3>
            <p className="text-sm text-gray-600 mt-2">
                Are you sure? To confirm, please type "disconnect" in the box below.
            </p>
            <input 
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="mt-4 w-full p-2 border rounded"
                // We remove the pattern and handle validation in our function
            />
            {disconnectError && <p className="text-xs text-red-600 mt-1">{disconnectError}</p>}
            <div className="mt-4 flex justify-end gap-2">
                <button onClick={closeDisconnectModal} className="px-4 py-2 bg-gray-200 rounded">
                    Cancel
                </button>
                <button onClick={() => handleDisconnect(platformToDisconnect)} className="px-4 py-2 bg-red-600 text-white rounded">
                    Confirm
                </button>
            </div>
        </div>
    </div>
)}
            </div>
        </div>
        
    );
};

// --- Platforms Component ---
const PlatformsTabContent = ({ connectionStatus, fetchConnections, setAlert }) => {
    const [shopifyStore, setShopifyStore] = useState('');
    
    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect your ${platform} account?`)) return;
        try {
            const res = await fetch('/api/social/connections/status', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform }),
            });
            if (!res.ok) throw new Error((await res.json()).message || `Could not disconnect ${platform}.`);
            await fetchConnections(); 
            setAlert({ show: true, message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully!`, type: 'success' });
        } catch (err) {
            console.error(`Could not disconnect ${platform}:`, err);
            setAlert({ show: true, message: err.message, type: 'danger' });
        }
    };    
      const handleShopifyConnect = () => {
        if (!shopifyStore) {
            alert('Please enter your store name.');
            return;
        }
        window.location.href = `/api/connect/shopify?shop=${shopifyStore}`;
    };

    const shopifyConnection = connectionStatus.shopify || { isConnected: false, shopName: null };

    return (
       <div className="max-w-3xl space-y-4">
             <h3 className="text-lg font-medium leading-6 text-gray-900">Platform Integrations</h3>
            <p className="mt-1 text-sm text-gray-500">Connect your e-commerce and other platforms.</p>

            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <p className="font-semibold">Shopify</p>
                <p className="text-sm text-gray-500">Connect your Shopify store to link social media performance to sales.</p>
                {shopifyConnection.isConnected ? (
                    <>
                    <div className="flex items-center gap-x-4 mt-2">
                        <span className="flex items-center text-sm font-medium text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1.5" />Connected</span>
                        <button onClick={() => handleDisconnect('shopify')} className="text-sm font-medium text-red-600 hover:text-red-800">Disconnect</button>
                    </div>
                    {shopifyConnection.shopName && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                                Connected to: <span className="font-semibold">{shopifyConnection.shopName}</span>
                            </div>
                        )}
                        </>
                ) : ( 
                    <div className="mt-3 flex items-center gap-x-2">
                        <div className="relative rounded-md shadow-sm">
                            <input
                                type="text"
                                name="shop"
                                id="shop"
                                className="block w-full rounded-md border-0 py-1.5 pr-12 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="your-store-name"
                                value={shopifyStore}
                                onChange={(e) => setShopifyStore(e.target.value)}
                                required
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-500 sm:text-sm">.myshopify.com</span>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleShopifyConnect}
                            className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                        >
                            Connect
                        </button>
                    </div>                
                )}
            </div>
             <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Mailchimp</p>
                        <p className="text-sm text-gray-500">Connect your Mailchimp account to sync audience and campaign data.</p>
                    </div>
                    {connectionStatus.mailchimp ? (
                        <div className="flex items-center gap-x-4">
                            <span className="flex items-center text-sm font-medium text-green-600">
                                <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                                Connected
                            </span>
                            <button 
                                onClick={() => handleDisconnect('mailchimp')} 
                                className="text-sm font-medium text-red-600 hover:text-red-800"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <a 
                            href="/api/connect/mailchimp" 
                            className="rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-400"
                        >
                            Connect Mailchimp
                        </a>
                    )}
                </div>
            </div>
             <QuickBooksConnect />
        </div>
    );
};

// --- Widget Settings Component ---
const WidgetSettingsTabContent = () => {
    const [siteId, setSiteId] = useState(null);
    const [mainSnippet, setMainSnippet] = useState('Loading your widget code...');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchSiteId = async () => {
            try {
                const response = await fetch('/api/get-site-id');
                if (!response.ok) {
                    throw new Error('Could not fetch Site ID.');
                }
                const data = await response.json();
                setSiteId(data.siteId);
            } catch (error) {
                console.error("Widget Error:", error);
                setMainSnippet('There was an error loading your widget code. Please try refreshing the page.');
            }
        };
        fetchSiteId();
    }, []);

    useEffect(() => {
        if (siteId) {
            const snippet = `<script>
(function() {
    const SITE_ID = '${siteId}';
    const API_ENDPOINT = 'https://tracker.cortexcart.com/api/track';
    const EXP_API_ENDPOINT = 'https://tracker.cortexcart.com/api/experiments/active';
    let abTestInfo = null;

    function sendEvent(eventName, data = {}) {
        const eventData = { siteId: SITE_ID, eventName: eventName, data: { ...data, path: window.location.pathname, referrer: document.referrer, abTest: abTestInfo }};
        try { navigator.sendBeacon(API_ENDPOINT, JSON.stringify(eventData)); } catch(e) { fetch(API_ENDPOINT, { method: 'POST', body: JSON.stringify(eventData), keepalive: true }); }
    }

    document.addEventListener('click', function(e) {
        sendEvent('click', { x: e.pageX, y: e.pageY, screenWidth: window.innerWidth });
    }, true);

    async function runAbTest() {
        try {
            const res = await fetch(\`\${EXP_API_ENDPOINT}?path=\${encodeURIComponent(window.location.pathname)}&siteId=\${SITE_ID}\`);
            if (!res.ok) return;
            const experiment = await res.json();
            if (!experiment) return;
        } catch (e) { console.error('CortexCart A/B Test Error:', e); }
    }

    async function initializeTracker() {
        await runAbTest();
        sendEvent('pageview');
    }

    window.cortexcart = { track: sendEvent };
    initializeTracker();
})();
<\/script>`.trim();
            setMainSnippet(snippet);
        }
    }, [siteId]);

    const handleCopy = () => {
        if (!siteId || !mainSnippet) return;
        navigator.clipboard.writeText(mainSnippet).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="max-w-3xl space-y-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Main Tracker Script</h3>
            <p className="mt-1 text-sm text-gray-600">Place this script just before the closing `&lt;/head&gt;` tag on every page.</p>
            <div className="p-4 bg-gray-900 rounded-md text-white font-mono text-sm overflow-x-auto relative mt-4" style={{ height: '350px' }}>
                <button
                    onClick={handleCopy}
                    disabled={!siteId}
                    className="absolute top-2 right-2 flex items-center gap-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs disabled:opacity-50"
                >
                    {isCopied ? <CheckCircleIcon className="h-4 w-4 text-green-400"/> : <ClipboardDocumentIcon className="h-4 w-4" />}
                    {isCopied ? 'Copied!' : 'Copy Code'}
                </button>
                <pre><code>{mainSnippet}</code></pre>
            </div>
        </div>
    );
};

// --- Billing Component ---
const BillingTabContent = () => (
    <div className="max-w-3xl">
        <div className="flex items-center gap-x-3">
            <CheckCircleIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">Current Plan</h3>
        </div>
        <div className="mt-4 p-6 bg-white rounded-lg shadow-sm border flex justify-between items-center">
            <div>
                <p className="text-base font-semibold text-blue-600">Beta Plan</p>
                <p className="text-sm text-gray-500">You are currently on the free Beta plan.</p>
            </div>
        </div>
    </div>
);

// --- Danger Zone Component ---
const DangerZoneTabContent = () => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const handleAccountDelete = async () => {
        setIsDeleting(true);
        try { 
            await signOut({ callbackUrl: '/api/account/delete' }); 
        } catch { 
            setIsDeleting(false); 
        }
    };

    return (
        <>
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium">Are you sure?</h3>
                        <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md text-sm">Cancel</button>
                            <button onClick={handleAccountDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm disabled:bg-red-300">
                                {isDeleting ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-3xl">
                <h3 className="text-lg font-medium leading-6 text-red-700">Danger Zone</h3>
                <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-lg flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-red-800">Delete Account</h4>
                        <p className="mt-1 text-sm text-red-700">Permanently remove your account and all associated data.</p>
                    </div>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700">
                        Delete Account
                    </button>
                </div>
            </div>
        </>
    );
};
    
// --- Main Settings Page Component ---
function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const searchParams = useSearchParams();
    const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
    const [connectionStatus, setConnectionStatus] = useState({});

    const fetchConnections = useCallback(async () => {
        try {
            const statusRes = await fetch('/api/social/connections/status', { cache: 'no-store' });
            if (!statusRes.ok) throw new Error('Could not fetch connection statuses.');
            const statuses = await statusRes.json();
            setConnectionStatus(statuses);
        } catch (err) {
            console.error("Failed to fetch platform connection data:", err);
            setAlert({ show: true, message: err.message, type: 'danger' });
        }
    }, []);
 
    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const tabFromHash = tabs.find(t => t.name.toLowerCase().replace(/ /g, '-') === hash);
            if (tabFromHash) {
                setActiveTab(tabFromHash.name);
            }
        }
    }, []);

    useEffect(() => {
        const connectStatus = searchParams.get('connect_status');
        if (connectStatus) {
            const message = connectStatus === 'success' 
                ? 'Account connected successfully!' 
                : searchParams.get('message')?.replace(/_/g, ' ') || 'An unknown error occurred.';
            setAlert({ show: true, message, type: connectStatus === 'success' ? 'success' : 'danger' });
            fetchConnections();
        }
    }, [searchParams, fetchConnections]);

 return (
 <Layout>
 <div className="mb-8">
 <h2 className="text-3xl font-bold">Settings, Integrations & Platforms</h2>
 <p className="mt-1 text-sm text-gray-500">Manage your site integrations, Platforms and tracking.</p>
 {alert.show && <AlertBanner title={alert.type === 'success' ? 'Success' : 'Error'} message={alert.message} type={alert.type} onClose={() => setAlert({ show: false, message: '', type: 'info' })} />}
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
 </div>
       
            <SettingsTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
 
            <div className="mt-8 bg-white p-8 rounded-lg">
                {activeTab === 'General' && <GeneralTabContent />}
                {activeTab === 'Integrations (GA4)' && <IntegrationsTabContent />}
                {activeTab === 'Social Connections' && 
                    <SocialConnectionsTabContent 
                        connectionStatus={connectionStatus} 
                        fetchConnections={fetchConnections} 
                        setAlert={setAlert}
                    />
                }
                {activeTab === 'Widget Code' && <WidgetSettingsTabContent />}
                {activeTab === 'Platforms' && 
                    <PlatformsTabContent 
                        connectionStatus={connectionStatus} 
                        fetchConnections={fetchConnections} 
                        setAlert={setAlert}
                    />
                }
                {activeTab === 'Billing' && <BillingTabContent />}
                {activeTab === 'Danger Zone' && <DangerZoneTabContent />}
            </div>
        </Layout>
    );
}

export default function SettingsPageWrapper() {
    return (
        <Suspense fallback={<Layout><div className="p-8">Loading Page...</div></Layout>}>
            <SettingsPage />
        </Suspense>
    )
}