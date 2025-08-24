// src/app/connect/callback/pinterest/page.js

'use client';
import { useEffect, useState, Suspense } from 'react'; // Import Suspense
import { useSearchParams } from 'next/navigation';
import { completePinterestConnection } from '@/lib/actions';

// This new component will contain the logic that uses useSearchParams
function PinterestCallbackHandler() {
    const searchParams = useSearchParams();
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('Connecting to Pinterest, please wait...');

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (code && state) {
            // Call the server action
            completePinterestConnection(code, state).catch(err => {
                setError(err.message);
                setMessage('Connection Failed');
            });
        } else {
            setError('Missing authorization code or state from Pinterest.');
            setMessage('Connection Failed');
        }
    }, [searchParams]);

    if (error) {
        return (
            <div>
                <p style={{ color: 'red' }}>{error}</p>
                <a href="/settings">Return to Settings</a>
            </div>
        );
    }
    
    // On success, the server action will redirect, so this message will only be seen briefly.
    return <p>{message}</p>;
}


// The main page component now wraps the handler in a Suspense boundary
export default function PinterestCallbackPage() {
    return (
        <div>
            <h1>Connecting to Pinterest...</h1>
            <Suspense fallback={<p>Loading connection details...</p>}>
                <PinterestCallbackHandler />
            </Suspense>
        </div>
    );
}