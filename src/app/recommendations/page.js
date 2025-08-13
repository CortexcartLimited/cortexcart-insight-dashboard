'use client';

// Corrected: Removed unused 'Fragment' import
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Layout from '@/app/components/Layout'; 
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

// --- NEW: Accordion-style Report Card Component ---
const AccordionReportCard = ({ report, isOpen, onToggle, onUpdate }) => {
    const groupedItems = report.items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <div className="bg-white rounded-lg shadow-md border">
            <button
                onClick={onToggle}
                className="w-full p-6 text-left flex justify-between items-center"
                aria-expanded={isOpen}
            >
                <h4 className="font-semibold text-gray-800">
                    Homepage Analysis - {new Date(report.created_at).toLocaleDateString()}
                </h4>
                {isOpen ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
            </button>
            
            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-200">
                    <div className="mt-4 space-y-4">
                        {Object.entries(groupedItems).map(([category, items]) => (
                            <div key={category}>
                                <h5 className="text-sm font-medium text-gray-600 uppercase tracking-wider">{category}</h5>
                                <ul className="mt-2 divide-y divide-gray-200">
                                    {items.map(item => <RecommendationItem key={item.id} item={item} onUpdate={onUpdate} />)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// RecommendationItem component remains unchanged
const RecommendationItem = ({ item, onUpdate }) => {
    const isCompleted = item.status === 'completed';
    return (
        <li className="flex items-start space-x-3 py-2">
            <button onClick={() => onUpdate(item.id, isCompleted ? 'pending' : 'completed')} className="flex-shrink-0 pt-0.5">
                <CheckCircleIcon className={`h-6 w-6 transition-colors ${isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`} />
            </button>
            <p className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {item.recommendation}
            </p>
        </li>
    );
};


export default function RecommendationsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [isAnalyzingHomepage, setIsAnalyzingHomepage] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [reportHistory, setReportHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [openReportId, setOpenReportId] = useState(null); // <-- State for the open accordion

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
        const res = await fetch('/api/recommendations');
        if (!res.ok) throw new Error("Could not fetch recommendation history.");
        const data = await res.json();
        setReportHistory(data);
        // --- NEW: Automatically open the first (most recent) report ---
        if (data && data.length > 0) {
            setOpenReportId(data[0].id);
        }
    } catch (error) {
        setAnalysisError(error.message);
    } finally {
        setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') {
        fetchHistory();
    }
  }, [status, router, fetchHistory]);
  
  const handleAnalyzeHomepage = async () => {
    setIsAnalyzingHomepage(true);
    setAnalysisError('');
    try {
      const res = await fetch('/api/ai/analyze-homepage', { method: 'POST' });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Failed to analyze homepage.');
      }
      await fetchHistory(); // This will refresh history and open the new report
    } catch (error) {
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzingHomepage(false);
    }
  };

  const handleUpdateRecommendation = async (id, newStatus) => {
    const originalHistory = [...reportHistory];
    setReportHistory(currentHistory => 
        currentHistory.map(report => ({
            ...report,
            items: report.items.map(item => 
                item.id === id ? { ...item, status: newStatus } : item
            )
        }))
    );
    try {
        await fetch('/api/recommendations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recommendationId: id, status: newStatus })
        });
    } catch (error) {
        console.error("Failed to update recommendation status:", error);
        setAnalysisError("Failed to update status. Please try again.");
        setReportHistory(originalHistory);
    }
  };

  const handleToggleReport = (reportId) => {
    // If the clicked report is already open, close it. Otherwise, open it.
    setOpenReportId(openReportId === reportId ? null : reportId);
  };

  if (status === 'loading') { return <Layout><p>Loading...</p></Layout>; }

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Homepage AI Recommendations</h2>
        <p className="mt-1 text-sm text-gray-500">Generate and manage AI-powered reports for your homepage.</p>
      </div>

      <div className="space-y-8 max-w-4xl">
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-gray-800">Analyze Homepage</h4>
                    <p className="mt-1 text-sm text-gray-600">Get a new AI report on your homepage&apos;s layout, copy, and performance.</p>
                </div>
                <button onClick={handleAnalyzeHomepage} disabled={isAnalyzingHomepage} className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                    {isAnalyzingHomepage ? 'Analyzing...' : 'Generate New Report'}
                </button>
            </div>
            {analysisError && <p className="text-sm text-red-600 mt-2">{analysisError}</p>}
        </div>

        <div>
            <h3 className="text-lg font-medium text-gray-900">Report History</h3>
            <div className="mt-4 space-y-4">
                {isLoadingHistory ? <p className="text-sm text-gray-500">Loading history...</p> : 
                reportHistory.length > 0 ? (
                    reportHistory.map(report => (
                        <AccordionReportCard 
                            key={report.id} 
                            report={report}
                            isOpen={openReportId === report.id}
                            onToggle={() => handleToggleReport(report.id)}
                            onUpdate={handleUpdateRecommendation}
                        />
                    ))
                ) : (
                    <p className="text-sm text-gray-500">No reports generated yet. Click the button above to create your first one.</p>
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
}
