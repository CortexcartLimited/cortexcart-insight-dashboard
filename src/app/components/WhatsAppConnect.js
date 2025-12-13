'use client';
import { useState } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function WhatsAppConnect() {
    const [isOpen, setIsOpen] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [formData, setFormData] = useState({
        phoneId: '',
        accessToken: ''
    });
    const [status, setStatus] = useState('idle'); // idle, saving, success, error

    const handleSave = async () => {
        setStatus('saving');
        try {
            const res = await fetch('/api/settings/connect-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to verify credentials');
            
            setStatus('success');
            setTimeout(() => setIsOpen(false), 2000); // Close after success
        } catch (e) {
            alert("Connection Failed: " + e.message);
            setStatus('error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-10 h-10" />
                    <div>
                        <h3 className="font-bold text-gray-900">WhatsApp Business</h3>
                        <p className="text-sm text-gray-500">Connect your number for 2-way messaging</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                    {status === 'success' ? 'Connected' : 'Connect Account'}
                </button>
            </div>

            {/* --- MODAL --- */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                            Important: Pricing & Billing
                        </h2>

                        {!acceptedTerms ? (
                            // STEP 1: PRICING NOTICE
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 space-y-2">
                                    <p><strong>You are connecting to the Official WhatsApp Cloud API.</strong></p>
                                    <p>By proceeding, you acknowledge that:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Meta charges <strong>per 24-hour conversation window</strong>.</li>
                                        <li>The first 1,000 service conversations each month are <strong>free</strong>.</li>
                                        <li>Marketing & Utility conversations are charged separately by Meta.</li>
                                        <li>You must have a payment method attached to your <strong>Meta Business Manager</strong>.</li>
                                        <li><strong>We do not charge markup</strong> on these messages; you pay Meta directly.</li>
                                    </ul>
                                </div>
                                <button 
                                    onClick={() => setAcceptedTerms(true)}
                                    className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black font-semibold"
                                >
                                    I Understand & Agree
                                </button>
                            </div>
                        ) : (
                            // STEP 2: CREDENTIALS FORM
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Please enter your <strong>Phone Number ID</strong> and <strong>Permanent System User Token</strong> from the Meta App Dashboard.
                                </p>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number ID</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 ring-green-500 outline-none"
                                        placeholder="e.g. 104xxxxxxxxxxxxx"
                                        value={formData.phoneId}
                                        onChange={(e) => setFormData({...formData, phoneId: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Permanent Access Token</label>
                                    <input 
                                        type="password" 
                                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 ring-green-500 outline-none"
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
                                        {status === 'saving' ? 'Verifying...' : 'Connect WhatsApp'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}