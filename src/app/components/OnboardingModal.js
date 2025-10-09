'use client';

import { useState, Fragment } from 'react';
import { CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { Dialog } from '@headlessui/react';

export default function OnboardingModal({ isOpen, onComplete, siteId }) {
    const [step, setStep] = useState('form'); // 'form' or 'widgetCode'
    const [isSaving, setIsSaving] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        address: '',
        postalCode: '',
        siteName: '',
        siteUrl: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/onboarding/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error('Failed to save data.');
            setStep('widgetCode'); // Move to the next step
        } catch (error) {
            console.error(error);
            // You could show an error message to the user here
        } finally {
            setIsSaving(false);
        }
    };

    const widgetSnippet = `<script>
(function() {
    const SITE_ID = '${siteId}';
    // ... rest of your widget code
})();
<\/script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(widgetSnippet).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
            {/* The backdrop, rendered as a fixed sibling to the panel container */}
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-8 shadow-xl">
                    {step === 'form' && (
                        <>
                            <Dialog.Title className="text-xl font-bold text-gray-900">Welcome! Let&apos;s get you set up.</Dialog.Title>
                            <p className="mt-2 text-sm text-gray-500">Please provide some basic information about your site:</p><form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                
                                <input name="siteName" onChange={handleChange} placeholder="Site Name" required className="w-full border-gray-300 rounded-md" />
                                <input name="siteUrl" onChange={handleChange} placeholder="Site URL (e.g., https://example.com)" type="url" required className="w-full border-gray-300 rounded-md" />
                                
                                <button type="submit" disabled={isSaving} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                                    {isSaving ? 'Saving...' : 'Continue'}
                                </button>
                            </form>
                        </>
                    )}
                    {step === 'widgetCode' && (
                        <>
                            <Dialog.Title className="text-xl font-bold text-gray-900">You&apos;re All Set!</Dialog.Title>
                            <p className="mt-2 text-sm text-gray-500">To start collecting data, copy and paste this code snippet into the `<head>paste code headers</head>` section of your website.</p>
                            <div className="p-4 bg-gray-900 rounded-md text-white font-mono text-sm overflow-x-auto relative mt-4">
                                <button onClick={handleCopy} className="absolute top-2 right-2 flex items-center gap-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs">
                                    {isCopied ? <CheckCircleIcon className="h-4 w-4 text-green-400"/> : <ClipboardDocumentIcon className="h-4 w-4" />}
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                                <pre><code>{widgetSnippet}</code></pre>
                            </div>
                             <p className="mt-2 text-xs text-gray-500">Don&apos;t worry, you can always find this code later in Settings &gt; Widget Settings.</p>
                            <div className="mt-6 text-right">
                                <button onClick={onComplete} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Done</button>
                            </div>
                        </>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}