'use client';

import { useState, useEffect } from 'react';
import AudienceGrowthChart from './AudienceGrowthChart'; // Make sure this path is correct
import { ShoppingCartIcon } from '@heroicons/react/24/outline';


// A small component for a loading spinner
const Spinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

// A small component for status badges
const StatusBadge = ({ status }) => {
    const statusStyles = {
        sent: 'bg-green-100 text-green-800',
        draft: 'bg-gray-100 text-gray-800',
        sending: 'bg-blue-100 text-blue-800',
        save: 'bg-yellow-100 text-yellow-800',
    };
    const style = statusStyles[status] || 'bg-gray-100 text-gray-800';
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${style}`}>
            {status}
        </span>
    );
};

export default function MailchimpTabContent() {
    const [audiences, setAudiences] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAudienceId, setSelectedAudienceId] = useState('');
    const [growthData, setGrowthData] = useState([]);
    const [isGrowthLoading, setIsGrowthLoading] = useState(false);
    const [ecommerceData, setEcommerceData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const results = await Promise.allSettled([
                    fetch('/api/mailchimp/audiences'),
                    fetch('/api/mailchimp/campaigns'),
                    fetch('/api/mailchimp/ecommerce')
                ]);

                // ✅ Consistent variable names: audiencesResult, campaignsResult
                const [audiencesResult, campaignsResult, ecommerceResult] = results;


                // Handle Audiences response
                if (audiencesResult.status === 'fulfilled' && audiencesResult.value.ok) {
                    const audiencesData = await audiencesResult.value.json();
                    setAudiences(audiencesData);
                    if (audiencesData.length > 0) {
                        setSelectedAudienceId(audiencesData[0].id);
                    }
                } else {
                    console.error("Failed to fetch audiences:", audiencesResult.reason || 'Request failed');
                    setError(prev => prev ? `${prev}\nFailed to fetch audiences.` : 'Failed to fetch audiences.');
                }
                                if (ecommerceResult.status === 'fulfilled' && ecommerceResult.value.ok) {
                    const ecommerceJson = await ecommerceResult.value.json();
                    setEcommerceData(ecommerceJson);
                } else {
                    console.error("Failed to fetch e-commerce data:", ecommerceResult.reason || 'Request failed');
                    // We don't set a main error for this, as it's an optional feature
                }

                // Handle Campaigns response
                if (campaignsResult.status === 'fulfilled' && campaignsResult.value.ok) {
                    const campaignsData = await campaignsResult.value.json();
                    setCampaigns(campaignsData);
                } else {
                    console.error("Failed to fetch campaigns:", campaignsResult.reason || 'Request failed');
                    setError(prev => prev ? `${prev}\nFailed to fetch campaigns.` : 'Failed to fetch campaigns.');
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedAudienceId) return;

        const fetchGrowthData = async () => {
            setIsGrowthLoading(true);
            try {
                const res = await fetch(`/api/mailchimp/audience-growth?list_id=${selectedAudienceId}`);
                if (!res.ok) throw new Error('Failed to fetch growth data.');
                const data = await res.json();
                setGrowthData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsGrowthLoading(false);
            }
        };

        fetchGrowthData();
    }, [selectedAudienceId]);

    const totalSubs = growthData.reduce((acc, day) => acc + day.subs, 0);
    const totalUnsubs = growthData.reduce((acc, day) => acc + day.unsubs, 0);

    if (isLoading) return <Spinner />;
    if (error && !audiences.length && !campaigns.length) return <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>;

    return (
         <div className="space-y-10">
            {/* ✅ TOP SECTION WRAPPER: AUDIENCES & ECOMMERCE PLACEHOLDER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                     {audiences.length === 0 ? (
                        <p className="text-gray-500">No audiences found.</p>
                    ) : (
                        audiences.slice(0, 1).map((audience) => (
                            <div key={audience.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 h-full">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Mailchimp Audience</h2>
                                <h4 className="font-semibold text-lg text-gray-700 truncate bg bg-green-100 p-2 text-center">{audience.name}</h4>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                    <div className="text-center">
                                         <p className="text-2xl font-bold text-blue-600">{audience.stats.member_count}</p>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Subscribers</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-700">{audience.stats.unsubscribe_count}</p>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Unsubscribed</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="lg:col-span-2">
                    {ecommerceData && !ecommerceData.hasEcommerce && (
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-full flex flex-col items-center justify-center text-center">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <ShoppingCartIcon className="h-8 w-8 text-indigo-600" />
                            </div>
                            <h3 className="mt-4 font-semibold text-lg text-gray-900">Unlock E-commerce Insights</h3>
                            <p className="mt-1 text-sm text-gray-500 max-w-md">
                                Connect your Shopify, WooCommerce, or other store in Mailchimp to see your revenue, orders, and top-selling products right here.
                            </p>
                            <a
                                href="https://mailchimp.com/integrations/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500"
                            >
                                Connect Your Store in Mailchimp
                            </a>
                        </div>
                    )}
                </div>
            </div>
            {/* GROWTH & HEALTH SECTION */}
            {audiences.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Audience Growth & Health</h2>
                        <select
                            value={selectedAudienceId}
                            onChange={(e) => setSelectedAudienceId(e.target.value)}
                            className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            {audiences.map(aud => (
                                <option key={aud.id} value={aud.id}>{aud.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        {isGrowthLoading ? <Spinner /> : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-600">{totalSubs}</p>
                                        <p className="text-xs text-blue-800 font-medium uppercase">New Subscribers (30 days)</p>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-red-600">{totalUnsubs}</p>
                                        <p className="text-xs text-red-800 font-medium uppercase">Unsubscribes (30 days)</p>
                                    </div>
                                    <div className="p-4 bg-gray-100 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-gray-800">{totalSubs - totalUnsubs}</p>
                                        <p className="text-xs text-gray-600 font-medium uppercase">Net Growth (30 days)</p>
                                    </div>
                                </div>
                                <AudienceGrowthChart growthData={growthData} />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* CAMPAIGNS SECTION */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Campaigns</h2>
                {campaigns.length === 0 ? (
                     <p className="text-gray-500">No recent campaigns found.</p>
                ) : (
                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Rate</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Click Rate</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.map((campaign) => (
                        <tr key={campaign.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={campaign.status} />
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900 truncate" style={{maxWidth: '300px'}}>
                                    {campaign.settings.subject_line || '(No Subject)'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {campaign.status === 'sent' 
                                        ? `Sent on ${new Date(campaign.send_time).toLocaleDateString()}` 
                                        : 'Draft'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                               {campaign.report_summary ? `${(campaign.report_summary.open_rate * 100).toFixed(2)}%` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                               {campaign.report_summary ? `${(campaign.report_summary.click_rate * 100).toFixed(2)}%` : 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
                    </div>
                )}
                
            </div>
        </div>
    );
}