'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/Layout';
import Link from 'next/link';

export default function ProductRecommendationsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  
  // New state for the top products table
  const [topProducts, setTopProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
    // Fetch top products when the component mounts
    if (status === 'authenticated') {
        async function fetchTopProducts() {
            setIsLoadingProducts(true);
            try {
                const res = await fetch('/api/stats/top-products');
                if (!res.ok) throw new Error('Failed to load product data.');
                const data = await res.json();
                setTopProducts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoadingProducts(false);
            }
        }
        fetchTopProducts();
    }
  }, [status, router]);
  
  const handleAnalyzeProducts = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError('');
    try {
        const res = await fetch('/api/ai/analyze-products', { method: 'POST' });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to analyze products.');
        setAnalysisResult(result);
    } catch (error) {
        setAnalysisError(error.message);
    } finally {
        setIsAnalyzing(false);
    }
  };

  if (status === 'loading') {
    return <Layout><p className="p-6">Loading...</p></Layout>;
  }

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">AI Product Recommendations</h2>
        <p className="mt-1 text-sm text-gray-500">Get AI-powered suggestions and see your top-performing products.</p>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* --- AI Analysis Card (Existing) --- */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-gray-800">Analyze Product Performance</h4>
                    <p className="mt-1 text-sm text-gray-600">Get suggestions for improving underperforming product titles and descriptions.</p>
                </div>
                <button
                    onClick={handleAnalyzeProducts}
                    disabled={isAnalyzing}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Generate Suggestions'}
                </button>
            </div>
            {analysisError && <p className="text-sm text-red-600 mt-2">{analysisError}</p>}
            {analysisResult && (
                <div className="p-4 bg-white text-gray-950 rounded-md border mt-4">
                    {/* ... Analysis result display ... */}
                </div>
            )}
        </div>

        {/* --- New Top Products Table --- */}
        <div>
            <h3 className="text-lg font-medium text-gray-900">Most Viewed Products</h3>
            <div className="mt-4 flow-root">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Product Name</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Views</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">View Product</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {isLoadingProducts ? (
                                <tr><td colSpan="3" className="py-4 text-center text-gray-500">Loading products...</td></tr>
                            ) : topProducts.length > 0 ? (
                                topProducts.map((product) => (
                                    <tr key={product.productName}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{product.productName}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.views.toLocaleString()}</td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <Link href={product.path || '#'} target="_blank">
                                                <div className="text-blue-600 hover:text-blue-900">View Product</div>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" className="py-4 text-center text-gray-500">No product view data found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}
