// src/app/connect/callback/pinterest/page.js

'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { completePinterestConnection } from '@/lib/actions';

export default function PinterestCallbackPage() {
    const searchParams = useSearchParams();
    const [error, setError] = useState(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (code && state) {
            // Call the server action
            completePinterestConnection(code, state).catch(err => {
                setError(err.message);
            });
        } else {
            setError('Missing authorization code or state from Pinterest.');
        }
    }, [searchParams]);

    if (error) {
        return (
            <div>
                <h1>Connection Failed</h1>
                <p>There was an error connecting your Pinterest account:</p>
                <p style={{ color: 'red' }}>{error}</p>
                <a href="/settings">Return to Settings</a>
            </div>
        );
    }

    return <h1>Connecting to Pinterest, please wait...</h1>;
}