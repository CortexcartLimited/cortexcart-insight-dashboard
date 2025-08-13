'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/Layout';
import { CheckCircleIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function RoadmapPage() {
    const { status } = useSession();
    const router = useRouter();
    
    // State to hold features fetched from the API
    const [features, setFeatures] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
        
        // Fetch the roadmap data from the API
        async function fetchRoadmap() {
            try {
                const res = await fetch('/api/admin/roadmap');
                if (!res.ok) throw new Error('Failed to load roadmap data.');
                const data = await res.json();
                setFeatures(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRoadmap();
    }, [status, router]);

    // Filter features into their respective categories
    const completedFeatures = features.filter(f => f.status === 'completed');
    const inProgressFeatures = features.filter(f => f.status === 'in_progress');
    const futureFeatures = features.filter(f => f.status === 'future');

    if (status === 'loading' || isLoading) {
        return <Layout><p className="p-6">Loading Roadmap...</p></Layout>;
    }

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold">Product Roadmap</h2>
                <p className="mt-1 text-sm text-gray-500">Follow our progress as we build new features and improve the app.</p>
            </div>

            <div className="space-y-12">
                {/* --- Completed Features --- */}
                <section>
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                        <h3 className="text-2xl font-semibold text-gray-900">Completed</h3>
                    </div>
                    <ul className="mt-4 space-y-4">
                        {completedFeatures.map(feature => (
                            <li key={feature.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <p className="font-semibold text-gray-800">{feature.name}</p>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </li>
                        ))}
                    </ul>
                </section>
                
                {/* --- In Progress Features --- */}
                <section>
                    <div className="flex items-center gap-3">
                        <ClockIcon className="h-8 w-8 text-blue-500" />
                        <h3 className="text-2xl font-semibold text-gray-900">In Progress</h3>
                    </div>
                    <ul className="mt-4 space-y-4">
                        {inProgressFeatures.map(feature => (
                            <li key={feature.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <p className="font-semibold text-gray-800">{feature.name}</p>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* --- Future Features --- */}
                <section>
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="h-8 w-8 text-purple-500" />
                        <h3 className="text-2xl font-semibold text-gray-900">Future Plans</h3>
                    </div>
                    <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {futureFeatures.map(feature => (
                            <li key={feature.id} className="p-4 bg-white border border-dashed border-gray-300 rounded-lg">
                                <p className="font-semibold text-gray-800">{feature.name}</p>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </Layout>
    );
}
