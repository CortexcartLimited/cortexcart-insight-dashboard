'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // ✅ Import useSession
import { useRouter } from 'next/navigation'; // ✅ Import useRouter
import Layout from '@/app/components/Layout';

export default function ReportsPage() {
    // ✅ --- ADD THIS AUTHENTICATION LOGIC ---
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/'); // Redirect to homepage if not logged in
        }
    }, [status, router]);
    // --- END OF AUTHENTICATION LOGIC ---

    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    const generateReport = async () => {
        setIsLoading(true);
        setReportData(null);
        setError(null);
        try {
            // Step 1: Fetch the aggregated data
            const dataRes = await fetch('/api/ai/reporting-data');
            if (!dataRes.ok) throw new Error('Failed to fetch reporting data.');
            const aggregatedData = await dataRes.json();

            // Step 2: Send that data to the AI for report generation
            const reportRes = await fetch('/api/ai/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aggregatedData),
            });
            if (!reportRes.ok) throw new Error('Failed to generate AI report.');
            
            const finalReport = await reportRes.json();
            setReportData(finalReport);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // ✅ Add a loading/unauthenticated check before rendering the main content
    if (status === 'loading' || status === 'unauthenticated') {
        return <Layout><div className="p-8">Loading...</div></Layout>;
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold">AI Performance Report</h2>
                    <p className="mt-1 text-sm text-gray-500">Generate an AI-powered analysis of your recent marketing performance.</p>
                </div>
                <button
                    onClick={generateReport}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating...' : 'Generating New Report'}
                </button>
            </div>

            {/* The rest of your rendering logic remains the same */}
            {isLoading && (
                 <div className="text-center p-12">
                    <p className="font-semibold">Cortex is analyzing your data...</p>
                    <p className="text-gray-500">This may take up to a minute.</p>
                </div>
            )}

            {error && <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>}

            {reportData && (
                <div className="space-y-10">
                    {/* ... your existing report rendering JSX ... */}
                </div>
            )}
        </Layout>
    );
}