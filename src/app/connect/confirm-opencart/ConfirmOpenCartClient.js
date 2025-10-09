// src/app/connect/confirm-opencart/ConfirmOpenCartClient.js
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ConfirmOpenCartClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const state = searchParams.get('state');
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        setError('');
        try {
            const response = await fetch('/api/connect/callback/opencart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to connect OpenCart.');
            }
            
            if (data.returnUrl) {
                window.location.href = data.returnUrl;
            } else {
                 throw new Error('Return URL was not provided by the server.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (!state) {
        return <div className="p-8 text-center text-red-500">Error: State parameter is missing. Please restart the connection process.</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white shadow-md rounded-lg text-center">
                <h1 className="text-2xl font-bold mb-4">Confirm OpenCart Connection</h1>
                <p className="mb-6">Do you want to connect your CortexCart account to your OpenCart store?</p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <button
                    onClick={handleConfirm}
                    className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    Confirm & Connect
                </button>
            </div>
        </div>
    );
}