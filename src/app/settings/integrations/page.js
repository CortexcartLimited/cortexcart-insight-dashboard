'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/solid';
import ConfirmationModal from '@/app/components/ConfirmationModal';

const PROPERTY_LIMIT = 6;

export default function IntegrationsPage() {
    // ... (keep all your existing state and functions: useState, useEffect, handleAddProperty, etc.)
    const [properties, setProperties] = useState([]);
    const [newPropertyId, setNewPropertyId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState(null);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await fetch('/api/ga4-connections');
                if (!response.ok) throw new Error('Failed to load your properties.');
                const data = await response.json();
                setProperties(data);
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
            const newProperty = await response.json();
            if (!response.ok) throw new Error(newProperty.message || 'Failed to add property.');
            setProperties([...properties, newProperty]);
            setNewPropertyId('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!propertyToDelete) return;
        setError('');
        try {
            const response = await fetch('/api/ga4-connections', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: propertyToDelete }),
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to delete property.');
            }
            setProperties(properties.filter(p => p.id !== propertyToDelete));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsModalOpen(false);
            setPropertyToDelete(null);
        }
    };
    
    const openDeleteModal = (id) => {
        setPropertyToDelete(id);
        setIsModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsModalOpen(false);
        setPropertyToDelete(null);
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

            {/* New Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-6 border rounded-lg bg-white shadow-sm">
                        <h3 className="font-semibold text-gray-800">Add New Property</h3>
                        <form onSubmit={handleAddProperty} className="mt-4 flex items-center gap-2">
                            <input
                                type="text"
                                value={newPropertyId}
                                onChange={(e) => setNewPropertyId(e.target.value)}
                                placeholder="Enter GA4 Property ID (e.g., 123456789)"
                                className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md"
                                //pattern="\\d+"
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
                                    <div key={prop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                        <span className="font-mono text-sm text-gray-700">{prop.ga4_property_id}</span>
                                        <button onClick={() => openDeleteModal(prop.id)} className="text-gray-400 hover:text-red-600">
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

                {/* Column 2: Instructional Card */}
                <div className="lg:col-span-1">
                    <div className="p-6 border rounded-lg bg-white shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-4">How to Find Your Property ID</h3>
                        <div className="space-y-4 text-sm text-gray-600">
                            <p>Follow these steps in your Google Analytics account:</p>
                            <ol className="list-decimal list-inside space-y-2 pl-2">
                                <li>Go to the <strong className="font-semibold">Admin</strong> section (gear icon in the bottom-left).</li>
                                <li>In the 'Property' column, select your desired property.</li>
                                <li>Click on <strong className="font-semibold">Property Settings</strong>.</li>
                                <li>Your <strong className="font-semibold">Property ID</strong> is the number shown at the top (e.g., 123456789).</li>
                            </ol>
                            
                            {/* Placeholder for the video */}
                            <div className="mt-6">
                                <h4 className="font-semibold text-gray-700 mb-2">Watch a video guide</h4>
                                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <iframe width="560" height="315" src="https://www.youtube.com/embed/cJ1rQ6OjuYM?si=ghKWSGbQ3lrfqH8H" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Delete Property"
            >
                Are you sure you want to disconnect this property? This action cannot be undone.
            </ConfirmationModal>
        </Layout>
    );
}