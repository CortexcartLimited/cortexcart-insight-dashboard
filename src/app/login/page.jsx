// src/app/login/page.jsx

'use client';
import { useEffect, useState, Suspense } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// --- Social Media Icons ---
const GoogleIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path><path d="M1 1h22v22H1z" fill="none"></path></svg>;
const FacebookIcon = () => <svg fill="#1877F2" viewBox="0 0 24 24" className="h-6 w-6 mr-2"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.77-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.028C18.343 21.128 22 16.991 22 12z"></path></svg>;
const PinterestIcon = () => <svg fill="#E60023" viewBox="0 0 24 24" className="h-5 w-5 mr-3"><path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.04 2.58 7.43 6.1 8.76-.08-.8-.13-1.68.04-2.58l1.1-4.7c.2-.8.1-1.7-.5-2.3-1-1-1.2-2.3-.6-3.5.7-1.3 2.5-1.6 3.8-.8 1.4.8 1 2.9-.4 4.1-1 1-2.2 2.1-2.2 4.1 0 1.6 1.1 2.8 2.6 2.8 3 0 5-2.2 5-5.5 0-2.9-2.1-5-5-5-3.4 0-5.4 2.5-5.4 5.1 0 .9.3 1.6.7 2.1.1.1.1.2 0 .3l-.3 1.3c0 .1-.1.2-.2.1-1.5-.6-2.4-2.3-2.4-4 0-3.2 2.3-6.2 6.8-6.2 3.6 0 6.4 2.6 6.4 6.1 0 3.8-2.2 6.7-5.3 6.7-1.8 0-3.3-1-2.8-2.3.5-1.1 1.5-2.2 1.5-3 0-1.2-.6-2.2-1.8-2.2-1.4 0-2.6 1.5-2.6 3.3 0 1.2.4 2 .8 2.5.1.1 0 .2-.1.5L8 18.3c-.2.9-.7 1.9-1.1 2.5-.2.3-.2.6-.1.9.1.3.4.5.7.5 1 0 1.8-.7 2.2-1 .1-.1.3-.4.4-.7.1-.4.2-1 .3-1.4l.3-1.3c.2-.9.7-1.7 1.3-2.2 1.2-1.1 2.8-1 4.3.4 1.5.8 2.3 2.1 2.3 3.6 0 2.9-1.9 4.9-5.1 4.9-2.5 0-4.8-1.7-4.2-4.1.4-1.8 1.3-3.6 1.3-4.9 0-1.8-1-3.4-3.1-3.4-2.5 0-4.5 2.1-4.5 4.8 0 1.3.4 2.2.9 2.8 0 .1 0 .2-.1.4l-.8 3.2c-.3 1.2-1.2 2.8-1.2 2.8-.2.1-.5 0-.7-.2-.6-.5-1-1.5-1-2.8 0-1.8.7-3.4 1.6-4.7C2.9 14.8 1.5 12.3 1.5 9.5 1.5 5.1 6.2 1.5 12 1.5z"></path></svg>;

function LoginForm() {
    const [providers, setProviders] = useState(null);
    const searchParams = useSearchParams();
    const [error, setError] = useState(null);

    // This object maps provider IDs to their button labels and icons
    const providerDetails = {
        'google': { label: 'Google & YouTube', icon: <GoogleIcon /> },
        'facebook': { label: 'Facebook & Instagram', icon: <FacebookIcon /> },
        'pinterest': { label: 'Pinterest', icon: <PinterestIcon /> },
         'x': { label: 'x', icon: <twitterIcon /> },
    };

    useEffect(() => {
        setError(searchParams.get('error'));
        
        const fetchProviders = async () => {
            const res = await getProviders();
            setProviders(res);
        };
        fetchProviders();
    }, [searchParams]);

    return (
        <Card className="w-full max-w-sm bg-white shadow-md">
            <CardHeader className="text-center">
                <Image src="/cortexcart-com-logo-home.png" alt="CortexCart Logo" width={320} height={100} className="mx-auto mb-4" />
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to access your dashboard</CardDescription>
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4" role="alert">
                        <p className="font-bold">Login Failed</p>
                        <p>There was an issue with your sign-in attempt. Please try again.</p>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {providers && Object.values(providers).map((provider) => {
                        // Exclude the email/password provider from this list
                        if (provider.id === 'credentials') {
                            return null;
                        }

                        // Get the custom details or use provider's default name
                        const details = providerDetails[provider.id.toLowerCase()];
                        const label = details ? details.label : provider.name;
                        const icon = details ? details.icon : null;

                        return (
                            <Button
                                key={provider.id}
                                onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                                variant="outline"
                                className="w-full flex justify-center items-center"
                            >
                                {icon}
                                <span>Sign in with {label}</span>
                            </Button>
                        );
                    })}
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">App Version: {process.env.NEXT_PUBLIC_APP_VERSION}</p>
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <>
            <div
                className="flex items-center justify-center min-h-screen bg-cover bg-center"
                style={{ backgroundImage: "url('/uploads/Gemini_Generated_Image_mpqbl4mpqbl4mpqb.webp')", backgroundSize: "cover" }}
            >
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
            <footer className="w-full text-center p-4 bg-blue-950 text-gray-100 text-sm">
                &copy; {new Date().getFullYear()} CortexCart. All Rights Reserved.
                <div className="flex justify-center space-x-4 mt-2">
                    <Link href="/terms" className="hover:underline">Terms of Service</Link>
                    <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                </div>
            </footer>
        </>
    );
}