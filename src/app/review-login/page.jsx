// src/app/review-login/page.jsx

'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function ReviewLoginPage() {
    const [email, setEmail] = useState('review-test@cortexcart.com');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false, // We handle the redirect manually
                email: email,
                password: password,
            });

            if (result.error) {
                setError('Invalid email or password. Please try again.');
                setIsLoading(false);
            } else {
                // On success, redirect to the dashboard
                router.push('/dashboard');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <Image src="/cortexcart-com-logo-home.png" alt="CortexCart Logo" width={280} height={80} className="mx-auto mb-4" />
                        <CardTitle>Review Team Login</CardTitle>
                        <CardDescription>Please sign in to review the application</CardDescription>
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mt-4" role="alert">
                                <p>{error}</p>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1"
                                    readOnly // Pre-filled and read-only for convenience
                                />
                            </div>
                            <div>
                                <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="mt-1"
                                    placeholder="Enter the password"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <footer className="w-full text-center p-4 bg-white text-gray-500 text-sm">
                <div className="flex justify-center space-x-4">
                    <Link href="/terms" className="hover:underline">Terms of Service</Link>
                    <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                </div>
            </footer>
        </>
    );
}