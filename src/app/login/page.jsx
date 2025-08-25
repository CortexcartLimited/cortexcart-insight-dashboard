// src/app/login/page.jsx

'use client';
import { useEffect, useState, Suspense } from 'react'; // Import Suspense
import { getProviders, signIn } from 'next-auth/react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Helper for provider icons
const ProviderIcon = ({ providerName }) => {
    const iconPath = `/logos/${providerName.toLowerCase()}logo.png`;
    return <Image src={iconPath} alt={`${providerName} logo`} width={20} height={20} className="mr-2" unoptimized />;
};

// --- NEW CHILD COMPONENT ---
// All the logic that uses searchParams goes in here.
function LoginForm() {
    const [providers, setProviders] = useState(null);
    const searchParams = useSearchParams();
    const [error, setError] = useState(null);

    useEffect(() => {
        // We can safely get the error from the URL here
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
                    {providers && Object.values(providers).map((provider) => (
                        provider.name !== 'Pinterest' && provider.name !== 'Facebook' && (
                            <Button
                                key={provider.name}
                                onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                                variant="outline"
                                className="w-full"
                            >
                                <ProviderIcon providerName={provider.name} />
                                Sign in with {provider.name}
                            </Button>
                        )
                    ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">App Version: {process.env.NEXT_PUBLIC_APP_VERSION}</p>
            </CardContent>
        </Card>
    );
}

// --- MAIN PAGE COMPONENT (PARENT) ---
// This component's only job is to provide the layout and the Suspense boundary.
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