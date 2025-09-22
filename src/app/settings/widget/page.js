// src/app/settings/widget/page.js
'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import { ClipboardDocumentIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import  Link  from 'next/link';


export default function WidgetSettingsPage() {
    const [siteId, setSiteId] = useState(null);
    const [mainSnippet, setMainSnippet] = useState('Loading your widget code...');
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSiteId = async () => {
            try {
                const response = await fetch('/api/get-site-id');
                if (!response.ok) {
                    throw new Error('Could not fetch your site ID. Please try again later.');
                }
                const data = await response.json();
                if (!data.siteId) {
                    throw new Error('Site ID not found for your account.');
                }
                setSiteId(data.siteId);
            } catch (err) {
                console.error("Widget Error:", err);
                setError(err.message);
                setMainSnippet('There was an error loading your widget code.');
            }
        };
        fetchSiteId();
    }, []);

    useEffect(() => {
        if (siteId) {
            // This function generates the embeddable script with the user's unique siteId
            const snippet = `<script>
(function() {
    const SITE_ID = '${siteId}';
    const API_ENDPOINT = 'https://tracker.cortexcart.com/api/track';
    
    function sendEvent(eventName, data = {}) {
        const eventData = { siteId: SITE_ID, eventName: eventName, data: { ...data, path: window.location.pathname, referrer: document.referrer }};
        try { 
            navigator.sendBeacon(API_ENDPOINT, JSON.stringify(eventData)); 
        } catch(e) { 
            fetch(API_ENDPOINT, { method: 'POST', body: JSON.stringify(eventData), keepalive: true }); 
        }
    }

    document.addEventListener('click', (e) => sendEvent('click', { x: e.pageX, y: e.pageY }), true);
    
    window.cortexcart = { track: sendEvent };
    sendEvent('pageview');
})();
<\/script>`;
            setMainSnippet(snippet.trim());
        }
    }, [siteId]);

    const handleCopy = () => {
        if (!siteId || !mainSnippet) return;
        navigator.clipboard.writeText(mainSnippet).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500); // Reset after 2.5 seconds
        });
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">Tracking Widget</h2>
                <Link href="/settings" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
                           Back to Settings Page
                            </Link>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                    Install the CortexCart tracking script on your website to start gathering insights.
                </p>
                
                  <p className="mt-1 text-sm text-gray-600 bg-gray-100 p-4 rounded-md gray-500">
                  <InformationCircleIcon className="h-5 w-5 inline-block mr-1 text-blue-500" />
                  Copy the code below and place it in the <code className="font-mono text-sm text-gray-800 bg-gray-100 px-1 py-0.5 rounded">{'<head>'}</code> section of your website, just before the closing <code className="font-mono text-sm text-gray-800 bg-gray-100 px-1 py-0.5 rounded">{'</head>'}</code> tag.
                </p>

          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                
                <div>
                  
                
                {error && <p className="text-sm text-red-600 p-4 bg-red-50 rounded-md">{error}</p>}

                    <div className="p-4 bg-gray-900 rounded-md text-white font-mono text-sm overflow-x-auto relative mt-4">
                        <button
                            onClick={handleCopy}
                            disabled={!siteId}
                            className="absolute top-3 right-3 flex items-center gap-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs disabled:opacity-50"
                        >
                            {isCopied ? <CheckCircleIcon className="h-4 w-4 text-green-400"/> : <ClipboardDocumentIcon className="h-4 w-4" />}
                            {isCopied ? 'Copied!' : 'Copy Code'}
                        </button>
                        <pre><code className="language-javascript">{mainSnippet}</code></pre>
                    </div>
                    <p className="bg-gray-100 p-8">Still having difficulty? Try our <Link href="/faq" className="text-blue-500">FAQ's</Link> or <Link href="/pages/contact" className="text-blue-500">contact us</Link></p>
                </div>

                <div>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mt-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Installation Guides</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Need help installing the widget? Choose your platform below for detailed instructions.
                        </p>
                        <ul className="divide-y divide-gray-200">
                            
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Shopify</span>
                                <a href="/install/shopify" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Custom HTML/JavaScript Site</span>
                                <a href="/install/custom/" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">WooCommerce</span>
                                <a href="/install/woocommerce" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">BigCommerce</span>
                                <a href="/install/bigcommerce" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Magento</span>
                                <a href="/install/magento" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">SquareSpace</span>
                                <a href="/install/squarespace" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Wix</span>
                                <a href="/install/wix" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">PrestaShop</span>
                                <a href="/install/prestashop" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
                            <li className="py-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Opencart</span>
                                <a href="/install/opencart" className="text-blue-600 hover:text-blue-900 text-sm font-medium">View Guide &rarr;</a>
                            </li>
    
                        </ul>
                    </div>
                </div>
            </div>
        </Layout>
    );
}