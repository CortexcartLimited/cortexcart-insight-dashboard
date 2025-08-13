'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

export default function QuickBooksConnect({ isInitiallyConnected, setAlert }) {
    const [isConnected, setIsConnected] = useState(isInitiallyConnected);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(isInitiallyConnected);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isConnected && !companyInfo) {
            setIsLoading(true);
            axios.get('/api/quickbooks/company-info')
                .then(response => {
                    setCompanyInfo(response.data);
                    setError(null);
                })
                .catch(err => {
                    setError('Could not load company data.');
                    console.error(err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isConnected, companyInfo]);

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect QuickBooks?')) return;

        try {
            await axios.post('/api/quickbooks/disconnect');
            setIsConnected(false);
            setCompanyInfo(null);
            setAlert({ show: true, message: 'QuickBooks disconnected successfully!', type: 'success' });
        } catch (err) {
            console.error('Disconnect error:', err);
            setAlert({ show: true, message: 'Failed to disconnect QuickBooks.', type: 'danger' });
        }
    };

    return (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold">QuickBooks Online</p>
                    <p className="text-sm text-gray-500">Connect your QuickBooks account for financial data sync.</p>
                </div>
                {!isConnected && (
                    <a
                        href="/api/connect/quickbooks"
                        className="rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600"
                    >
                        Connect to QuickBooks
                    </a>
                )}
                {isConnected && (
                    <div className="flex items-center gap-x-4">
                        <span className="flex items-center text-sm font-medium text-green-600">
                            <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                            Connected
                        </span>
                        <button onClick={handleDisconnect} className="text-sm font-medium text-red-600 hover:text-red-800">
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
            {isLoading && isConnected && <p className="text-sm text-gray-500 mt-2">Loading company data...</p>}
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            {companyInfo && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700">Company Name: <span className="font-normal">{companyInfo.CompanyName}</span></p>
                    <p className="text-sm font-medium text-gray-700">Legal Name: <span className="font-normal">{companyInfo.LegalName}</span></p>
                    <p className="text-sm font-medium text-gray-700">Country: <span className="font-normal">{companyInfo.Country}</span></p>
                    <p className="text-sm font-medium text-gray-700">Industry: <span className="font-normal">{companyInfo.IndustryType}</span></p>
                </div>
            )}
        </div>
    );
}