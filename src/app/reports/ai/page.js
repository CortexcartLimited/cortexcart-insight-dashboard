'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/Layout';
import { ChartBarSquareIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Import chart component (ensure you have this or remove the chart section below)
import ReportChart from '@/app/components/reports/ReportChart';

export default function AiReportPage() {
    const { status } = useSession();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    // Auth Redirect
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    const generateReport = async () => {
        setIsLoading(true);
        setReportData(null);
        setError(null);
        
        try {
            // FIX: We only make ONE call now. The API handles data fetching internally.
            const res = await fetch('/api/ai/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    // Optional: Send specific dates if you build a date picker later
                    // startDate: '2024-01-01', 
                    // endDate: '2024-01-31' 
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to generate report.');
            }
            
            const data = await res.json();
            
            // The API returns { report: "<html>..." }
            // We set this directly to display it
            setReportData(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading') return <Layout><p className="p-8">Loading...</p></Layout>;

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-8 w-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">AI Performance Report</h1>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        Ask Cortex to analyze your sales, traffic, and marketing data for the last 30 days.
                    </p>
                </div>
                
                <button
                    onClick={generateReport}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl shadow-md hover:bg-purple-700 transition-all disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                    {isLoading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ChartBarSquareIcon className="h-5 w-5" />}
                    {isLoading ? 'Analyzing Data...' : 'Generate New Report'}
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 mb-6 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Loading State (Visual Placeholder) */}
            {isLoading && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cortex is connecting to your data sources...</p>
                </div>
            )}

            {/* Report Display */}
            {reportData && (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm prose prose-blue max-w-none">
                    {/* We use dangerouslySetInnerHTML because the AI returns formatted HTML */}
                    <div dangerouslySetInnerHTML={{ __html: reportData.report }} />
                </div>
            )}
            
            {/* Empty State */}
            {!reportData && !isLoading && !error && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No report generated yet. Click the button above to start.</p>
                </div>
            )}
        </Layout>
    );
}