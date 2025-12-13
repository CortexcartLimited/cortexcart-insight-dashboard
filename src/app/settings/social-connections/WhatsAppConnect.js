'use client';
import { useState } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function WhatsAppConnect({ onConnect }) {
    const [isOpen, setIsOpen] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [formData, setFormData] = useState({ phoneId: '', accessToken: '' });
    const [status, setStatus] = useState('idle'); // idle, saving, success, error

    const handleSave = async () => {
        setStatus('saving');
        try {
            const res = await fetch('/api/settings/connect-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to verify');
            
            setStatus('success');
            setTimeout(() => {
                setIsOpen(false);
                if (onConnect) onConnect(); // Refresh the parent list
            }, 1500);
        } catch (e) {
            alert("Connection Failed: " + e.message);
            setStatus('idle');
        }
    };

    return (
        <>
            {/* --- THE CARD (Visible on Page) --- */}
            <div className="p-6 border rounded-xl bg-white shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-12 h-12" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">WhatsApp Business</h3>
                        <p className="text-sm text-gray-500">Connect your Cloud API Number</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(true)}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                >
                    Connect
                </button>
            </div>

            {/* --- THE MODAL (Hidden by default) --- */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl relative">
                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                        
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-7 h-7 text-yellow-500" />
                            WhatsApp Integration Setup
                        </h2>

                        {!acceptedTerms ? (
                            // STEP 1: PRICING NOTICE
                            <div className="space-y-5">
                                <div className="bg-blue-50 p-5 rounded-xl text-sm text-blue-900 space-y-3">
                                    <p><strong>You are connecting to the Official Meta Cloud API.</strong></p>
                                    <ul className="list-disc pl-5 space-y-1 opacity-90">
                                        <li>Meta charges <strong>per conversation (24h window)</strong>.</li>
                                        <li>First 1,000 service conversations/month are <strong>free</strong>.</li>
                                        <li>You must add a payment method in your <strong>Meta Business Manager</strong>.</li>
                                        <li>We (CortexCart) do not charge extra fees for these messages.</li>
                                    </ul>
                                </div>
                                <button 
                                    onClick={() => setAcceptedTerms(true)}
                                    className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black font-semibold transition"
                                >
                                    I Understand & Agree
                                </button>
                            </div>
                        ) : (
                            // STEP 2: CREDENTIALS FORM
                            <div className="space-y-4 animate-fadeIn">
                                <p className="text-sm text-gray-600 mb-2">
                                    Enter your credentials from the <a href="https://developers.facebook.com/apps/" target="_blank" className="text-blue-600 underline">Meta App Dashboard</a>.
                                </p>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number ID</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 ring-green-500 outline-none"
                                        placeholder="e.g. 104555..."
                                        value={formData.phoneId}
                                        onChange={(e) => setFormData({...formData, phoneId: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Permanent Access Token</label>
                                    <input 
                                        type="password" 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 ring-green-500 outline-none"
                                        placeholder="EAA..."
                                        value={formData.accessToken}
                                        onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        disabled={status === 'saving'}
                                        className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold flex justify-center items-center gap-2"
                                    >
                                        {status === 'saving' ? 'Verifying...' : status === 'success' ? 'Connected!' : 'Save Connection'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}