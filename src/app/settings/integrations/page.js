// src/app/settings/integrations/page.js
'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { ArrowLeftCircle } from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/24/solid';



const PROPERTY_LIMIT = 6;

export default function IntegrationsPage() {
    const [properties, setProperties] = useState([]);
    const [newPropertyId, setNewPropertyId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await fetch('/api/ga4-connections');
                if (!response.ok) throw new Error('Failed to load your properties.');
                setProperties(await response.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    const handleAddProperty = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const response = await fetch('/api/ga4-connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: newPropertyId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setProperties([...properties, result]);
            setNewPropertyId('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProperty = async (idToDelete) => {
        if (!confirm('Are you sure you want to disconnect this property?')) return;
        try {
            const response = await fetch('/api/ga4-connections', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idToDelete }),
            });
            if (!response.ok) throw new Error((await response.json()).error);
            setProperties(properties.filter(p => p.id !== idToDelete));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <Layout><p className="p-8">Loading GA4 properties...</p></Layout>;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">Google Analytics (GA4) Integrations</h2>
                <Link href="/settings" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
                               Back to Settings Page
                            </Link>
                             </div>
                <p className="mt-1 text-sm text-gray-500 mb-8">Manage your connected GA4 properties.</p>
           

            <div className="max-w-3xl space-y-8">
                <div className="p-6 border rounded-lg bg-white shadow-sm">
                    <h3 className="font-semibold text-gray-800">Add New Property</h3>
                    <form onSubmit={handleAddProperty} className="mt-4 flex items-center gap-2">
                        <input
                            type="text"
                            value={newPropertyId}
                            onChange={(e) => setNewPropertyId(e.target.value)}
                            placeholder="Enter GA4 Property ID (e.g., 123456789)"
                            className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md"
                            pattern="\d+"
                            title="Please enter numbers only."
                            required
                            disabled={properties.length >= PROPERTY_LIMIT}
                        />
                        <button 
                            type="submit" 
                            disabled={isSubmitting || properties.length >= PROPERTY_LIMIT}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Property'}
                        </button>
                    </form>
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>

                <div className="p-6 border rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Connected Properties</h3>
                        <span className="text-sm text-gray-500">{properties.length} of {PROPERTY_LIMIT} used</span>
                    </div>
                    <div className="mt-4 space-y-2">
                        {properties.length > 0 ? (
                            properties.map(prop => (
                                <div key={prop.property_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <span className="font-mono text-sm text-gray-700">{prop.ga4_property_id}</span>
                                    <button onClick={() => handleDeleteProperty(prop.property_id)} className="text-gray-400 hover:text-red-600">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-center text-gray-500 py-4">No GA4 properties connected yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );


}