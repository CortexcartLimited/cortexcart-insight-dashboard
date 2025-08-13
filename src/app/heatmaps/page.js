'use client';

import { useState } from 'react';
import Layout from '@/app/components/Layout';
import h337 from 'heatmap.js';

export default function HeatmapPage() {
    const [urlToAnalyze, setUrlToAnalyze] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateHeatmap = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Clear any previous heatmap
        const existingHeatmap = document.getElementById('heatmap-container');
        if (existingHeatmap) existingHeatmap.innerHTML = '';

        try {
            // Get the path from the full URL
            const pagePath = new URL(urlToAnalyze).pathname;
            
            // Fetch the click data from our API
            const res = await fetch(`/api/heatmaps?path=${pagePath}`);
            if (!res.ok) throw new Error('Failed to fetch heatmap data.');
            const data = await res.json();

            if (data.length === 0) {
                setError('No click data found for this page in the last 30 days.');
                return;
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
            setError(err.message);
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
                        placeholder="Enter the full URL of a page to analyze..."
                        required
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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
               <div id="heatmap-container" className="relative w-full h-full pointer-events-none" style={{ gridArea: '1 / 1' }}></div>
<iframe
    src={urlToAnalyze}
    className="w-full h-full border-2 border-gray-300 rounded-lg"
    title="Website Preview"
    style={{ gridArea: '1 / 1' }}
></iframe>
            </div>
        </Layout>
    );
}
