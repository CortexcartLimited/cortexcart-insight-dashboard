'use client';

import { useState } from 'react';
import Layout from '@/app/components/Layout';
import h337 from 'heatmap.js';

export default function HeatmapPage() {
    const [urlToAnalyze, setUrlToAnalyze] = useState('');
    const [iframeUrl, setIframeUrl] = useState(''); // <--- NEW: Separate state for the iframe
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateHeatmap = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validate URL before proceeding
        let validUrl;
        try {
            validUrl = new URL(urlToAnalyze);
        } catch (_) {
            setError('Please enter a valid URL (e.g., https://example.com)');
            setIsLoading(false);
            return;
        }

        // 1. Update the iframe ONLY now
        setIframeUrl(urlToAnalyze);

        // Clear any previous heatmap
        const existingHeatmap = document.getElementById('heatmap-container');
        if (existingHeatmap) existingHeatmap.innerHTML = '';

        try {
            const pagePath = validUrl.pathname;
            
            // Fetch the click data
            const res = await fetch(`/api/heatmaps?path=${pagePath}`);
            if (!res.ok) throw new Error('Failed to fetch heatmap data.');
            const data = await res.json();

            if (data.length === 0) {
                setError('No click data found for this page in the last 30 days.');
                return; // Don't crash if no data
            }

            // Create and configure the heatmap instance
            const heatmapInstance = h337.create({
                container: document.getElementById('heatmap-container'),
                radius: 90,
            });

            // Find the max value for scaling
            const maxValue = data.reduce((max, point) => Math.max(max, point.value), 0);

            heatmapInstance.setData({
                max: maxValue,
                data: data,
            });

        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred generating the heatmap.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold">Heatmaps</h2>
                <p className="mt-1 text-sm text-gray-500">Visualize where users are clicking on your site.</p>
            </div>

            {/* Form to enter URL */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <form onSubmit={handleGenerateHeatmap} className="flex items-center gap-4">
                    <input
                        type="url"
                        value={urlToAnalyze}
                        onChange={(e) => setUrlToAnalyze(e.target.value)}
                        placeholder="Enter the full URL (e.g., https://cortexcart.com)"
                        required
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isLoading ? 'Loading...' : 'Generate Heatmap'}
                    </button>
                </form>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
            
            {/* Container for the heatmap and iframe */}
            <div className="mt-8 relative grid" style={{ width: '100%', height: '1200px' }}>
               <div id="heatmap-container" className="relative w-full h-full pointer-events-none z-10" style={{ gridArea: '1 / 1' }}></div>
               
               {/* FIX: Only render iframe if we have a valid URL committed */}
               {iframeUrl && (
                   <iframe
                        src={iframeUrl}
                        className="w-full h-full border-2 border-gray-300 rounded-lg"
                        title="Website Preview"
                        style={{ gridArea: '1 / 1' }}
                        sandbox="allow-same-origin allow-scripts" // Added sandbox for safety
                   ></iframe>
               )}
               
               {!iframeUrl && (
                   <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 bg-gray-50" style={{ gridArea: '1 / 1' }}>
                       Enter a URL above to see the heatmap overlay.
                   </div>
               )}
            </div>
        </Layout>
    );
}