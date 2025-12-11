'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import { PlusIcon, PencilIcon, TrashIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

export default function AbTestingPage() {
    const [experiments, setExperiments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [newExperiment, setNewExperiment] = useState({
        name: '',
        description: '',
        target_selector: '',
        target_path: '',
        control_content: '',
        variant_content: ''
    });

    const fetchExperiments = async () => {
        setIsLoading(true);
        const res = await fetch('/api/experiments');
        if (res.ok) {
            const data = await res.json();
            setExperiments(data);
        }
        setIsLoading(false);
    };

    useEffect(() => { fetchExperiments(); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewExperiment(prev => ({ ...prev, [name]: value }));
    };
// --- NEW: Handle Status Toggle ---
    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'running' ? 'draft' : 'running';
        
        // Optimistic UI update
        setExperiments(prev => prev.map(exp => 
            exp.id === id ? { ...exp, status: newStatus } : exp
        ));

        const res = await fetch(`/api/experiments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
            alert("Failed to update status");
            fetchExperiments(); // Revert on error
        } else {
            // Refresh to ensure any "auto-stopped" experiments are updated in UI
            fetchExperiments();
        }
    };

    const handleDelete = async (id) => {
        if(!confirm("Are you sure?")) return;
        await fetch(`/api/experiments/${id}`, { method: 'DELETE' });
        fetchExperiments();
    };

    const handleSaveExperiment = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/experiments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newExperiment),
        });

        if (res.ok) {
            setIsModalOpen(false);
            setNewExperiment({ name: '', description: '', target_selector: '', target_path: '', control_content: '', variant_content: '' });
            fetchExperiments();
        } else {
            alert('Failed to create experiment.');
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-800',
            running: 'bg-green-100 text-green-800',
            finished: 'bg-blue-100 text-blue-800',
        };
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
    };

    return (
        <Layout>
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">A/B Testing</h1>
                    <p className="mt-1 text-sm text-gray-600">Create and manage experiments to optimize your site.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Create New Experiment
                </button>
            </div>

            <div className="mt-6 flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-6 text-left text-sm font-semibold text-gray-900">Experiment Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Target Selector</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                 {isLoading ? (
                                        <tr><td colSpan="4" className="py-4 text-center text-gray-500">Loading experiments...</td></tr>
                                    ) : experiments.map((exp) => (
                                        <tr key={exp.id}>
                                            <td className="py-4 pl-6 text-sm font-medium text-gray-900">{exp.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 font-mono">{exp.target_path}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500"><StatusBadge status={exp.status} /></td>
                                            <td className="py-4 pl-3 pr-6 text-right text-sm font-medium">
                                                {/* --- PLAY / PAUSE BUTTONS --- */}
                                                {exp.status === 'running' ? (
                                                    <button 
                                                        onClick={() => handleToggleStatus(exp.id, 'running')}
                                                        className="text-green-600 hover:text-green-900 mr-4"
                                                        title="Stop Experiment"
                                                    >
                                                        <PauseIcon className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleToggleStatus(exp.id, 'draft')}
                                                        className="text-gray-400 hover:text-green-600 mr-4"
                                                        title="Start Experiment"
                                                    >
                                                        <PlayIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                                
                                                <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-red-600">
                                                    <TrashIcon className="h-5 w-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <form onSubmit={handleSaveExperiment} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Create New Experiment</h3>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Experiment Name</label>
                            <input type="text" name="name" id="name" value={newExperiment.name} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., Test new product title" required />
                        </div>
                        <div>
                            <label htmlFor="target_path" className="block text-sm font-medium text-gray-700">Target Path</label>
                            <input type="text" name="target_path" id="target_path" value={newExperiment.target_path} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., /products/my-product" required />
                        </div>
                        <div>
                            <label htmlFor="target_selector" className="block text-sm font-medium text-gray-700">CSS Selector</label>
                            <input type="text" name="target_selector" id="target_selector" value={newExperiment.target_selector} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm font-mono" placeholder="e.g., h1.product-title" required />
                        </div>
                        <div>
                            <label htmlFor="control_content" className="block text-sm font-medium text-gray-700">Control (Original Content)</label>
                            <textarea name="control_content" id="control_content" value={newExperiment.control_content} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required></textarea>
                        </div>
                        <div>
                            <label htmlFor="variant_content" className="block text-sm font-medium text-gray-700">Variant (New Content)</label>
                            <textarea name="variant_content" id="variant_content" value={newExperiment.variant_content} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required></textarea>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">Save Experiment</button>
                        </div>
                    </form>
                </div>
            )}
        </Layout>
    );
}
