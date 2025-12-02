'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/Layout';
import { DocumentPlusIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ReportsPage() {
    const { status } = useSession();
    const router = useRouter();

    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/reports/list'); // We will create this API in the next step
            if (!res.ok) throw new Error('Failed to load reports.');
            const data = await res.json();
            setReports(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
        if (status === 'authenticated') {
            fetchReports();
        }
    }, [status, router]);

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const res = await fetch('/api/ai/generate-report', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.message || 'Failed to generate report.');
            }
            // Refresh the list of reports after generating a new one
            await fetchReports();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    if (status === 'loading') {
        return <Layout><p className="p-6">Loading...</p></Layout>;
    }

    return (
        <Layout>
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold">AI Reports</h2>
                    <p className="mt-1 text-sm text-gray-500">Generate, view, and download detailed performance reports.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button 
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-blue-400"
                    >
                        {isGenerating ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <DocumentPlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />}
                        {isGenerating ? 'Generating Report...' : 'Generate New Report'}
                    </button>
                </div>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">Error: {error}</p>}

            <div className="mt-6 flow-root">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Report Date</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Download</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {isLoading ? (
                                <tr><td colSpan="3" className="py-4 text-center text-gray-500">Loading reports...</td></tr>
                            ) : reports.length > 0 ? (
                                reports.map((report) => (
                                    <tr key={report.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {new Date(report.created_at).toLocaleString()}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{report.status}</td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            {report.status === 'completed' && (
                                                <Link href={`/api/reports/${report.id}/download`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-900">
                                                    <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
                                                    Download PDF
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                            <tr><td colSpan="3" className="py-4 text-center text-gray-500">No reports generated yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
