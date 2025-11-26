'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// 1. Move the main logic into a sub-component
function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const router = useRouter();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        // Call the verification API
        fetch('/api/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
        .then(async (res) => {
            if (res.ok) {
                setStatus('success');
                setTimeout(() => router.push('/login'), 3000); // Redirect after 3s
            } else {
                setStatus('error');
            }
        })
        .catch(() => setStatus('error'));
    }, [token, router]);

    return (
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow text-center">
            {status === 'verifying' && <p>Verifying your email...</p>}
            
            {status === 'success' && (
                <div>
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Email Verified!</h2>
                    <p>Redirecting to login...</p>
                    <Link href="/login" className="text-blue-500 underline mt-4 block">Click here if not redirected</Link>
                </div>
            )}
            
            {status === 'error' && (
                <div>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
                    <p>The token may be invalid or expired.</p>
                    <Link href="/registration" className="text-blue-500 underline mt-4 block">Back to Sign Up</Link>
                </div>
            )}
        </div>
    );
}

// 2. Export the Main Page wrapped in Suspense
export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Suspense fallback={<div>Loading verification...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}