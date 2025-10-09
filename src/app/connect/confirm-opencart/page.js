// src/app/connect/confirm-opencart/page.js
import { Suspense } from 'react';
import ConfirmOpenCartClient from './ConfirmOpenCartClient';

// A simple loading UI to show while the client component loads
function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white shadow-md rounded-lg text-center">
                <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            </div>
        </div>
    );
}

export default function ConfirmOpenCartPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ConfirmOpenCartClient />
        </Suspense>
    );
}