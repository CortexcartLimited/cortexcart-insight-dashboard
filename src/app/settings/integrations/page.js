'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { TrashIcon, DocumentArrowUpIcon } from '@heroicons/react/24/solid';
import ConfirmationModal from '@/app/components/ConfirmationModal';

const PROPERTY_LIMIT = 6;

export default function IntegrationsPage() {
    const [properties, setProperties] = useState([]);
    const [newPropertyId, setNewPropertyId] = useState('');
    
    // NEW: State to hold the content of the uploaded JSON file
    const [jsonFileContent, setJsonFileContent] = useState(null); 
    const [fileName, setFileName] = useState('');

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

    // NEW: Handle File Selection and Reading
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                setJsonFileContent(event.target.result); // Save text content
            };
            reader.readAsText(file);
        }
    };

    const handleAddProperty = async (e) => {
        e.preventDefault();
        
        if (!jsonFileContent) {
            setError("Please upload your Google Service Account JSON file.");
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const response = await fetch('/api/ga4-connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    propertyId: newPropertyId,
                    credentials: jsonFileContent // Send file content to backend
                }),
            });
            const newProperty = await response.json();
            if (!response.ok) throw new Error(newProperty.message || 'Failed to add property.');
            
            setProperties([...properties, newProperty]);
            
            // Reset form
            setNewPropertyId('');
            setJsonFileContent(null);
            setFileName('');
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-6 border rounded-lg bg-white shadow-sm">
                        <h3 className="font-semibold text-gray-800">Add New Property</h3>
                        <form onSubmit={handleAddProperty} className="mt-4 space-y-4">
                            {/* Property ID Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GA4 Property ID</label>
                                <input
                                    type="text"
                                    value={newPropertyId}
                                    onChange={(e) => setNewPropertyId(e.target.value)}
                                    placeholder="e.g., 123456789"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    title="Please enter numbers only."
                                    required
                                    disabled={properties.length >= PROPERTY_LIMIT}
                                />
                            </div>

                            {/* JSON File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Account Key (JSON)</label>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                                        <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-gray-500" />
                                        {fileName ? fileName : "Upload JSON File"}
                                        <input 
                                            type="file" 
                                            accept=".json" 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                            required
                                        />
                                    </label>
                                    {fileName && <span className="text-xs text-green-600">Ready to upload</span>}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Upload the .json file you downloaded from Google Cloud Console.</p>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting || properties.length >= PROPERTY_LIMIT}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isSubmitting ? 'Adding...' : 'Add Property & Credentials'}
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
                                  <div className="mt-4 space-y-2">
    {properties.length > 0 ? (
        properties.map(prop => (
            <div key={prop.id} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-700">Property ID: {prop.ga4_property_id}</span>
                    <button onClick={() => openDeleteModal(prop.id)} className="text-gray-400 hover:text-red-600">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
                
                {/* ✅ NEW: Display the Service Account Email */}
                {prop.service_email && (
                    <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded border border-blue-100 break-all">
                        <p className="font-semibold mb-1">⚠️ Action Required:</p>
                        <p>Invite this email to your Google Analytics Property as a "Viewer":</p>
                        <code className="block mt-1 bg-white p-1 rounded select-all border border-blue-200">
                            {prop.service_email}
                        </code>
                    </div>
                )}
            </div>
        ))
    ) : (
        <p className="text-sm text-center text-gray-500 py-4">No GA4 properties connected yet.</p>
    )}
</div>
                                ))
                            ) : (
                                <p className="text-sm text-center text-gray-500 py-4">No GA4 properties connected yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="p-6 border rounded-lg bg-white shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-4">Setup Instructions</h3>
                        <div className="space-y-4 text-sm text-gray-600">
                            <p>To connect GA4, you need a <strong>Service Account Key</strong>:</p>
                            <ol className="list-decimal list-inside space-y-2 pl-2">
                                {/* FIX: Replaced > with &gt; in the lines below */}
                                <li>Go to Google Cloud Console &gt; IAM & Admin &gt; Service Accounts.</li>
                                <li>Create a new service account.</li>
                                <li>Click "Keys" &gt; "Add Key" &gt; "Create new key" &gt; Select <strong>JSON</strong>.</li>
                                <li>The file will download automatically. Upload that file here.</li>
                                <li><strong>Important:</strong> Copy the service account email (ends in @...iam.gserviceaccount.com) and add it as a user in your Google Analytics Property Access settings.</li>
                            </ol>
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