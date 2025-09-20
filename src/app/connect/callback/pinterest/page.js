// src/app/connect/callback/pinterest/page.js

'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { completePinterestConnection } from '@/lib/actions';

function PinterestCallbackHandler() {
    const searchParams = useSearchParams();
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('Connecting to Pinterest, please wait...');

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (code && state) {
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
                <a href="/settings/social-connections?connect_status=error">Return to Settings</a>
            </div>
        );
    }
    
    return <p>{message}</p>;
}

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