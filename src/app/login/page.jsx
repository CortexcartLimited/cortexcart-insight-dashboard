// src/app/login/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import Image from 'next/image';

// Helper to get a brand-appropriate icon for each provider
const ProviderIcon = ({ providerName }) => {
    const iconPath = `/logos/${providerName.toLowerCase()}logo.png`;
    return <Image src={iconPath} alt={`${providerName} logo`} width={20} height={20} className="mr-2" unoptimized />;
};

export default function LoginPage() {
    const [providers, setProviders] = useState(null);

    useEffect(() => {
        const fetchProviders = async () => {
            const res = await getProviders();
            setProviders(res);
        };
        fetchProviders();
    }, []);

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center"
            style={{ backgroundImage: "url('uploads/Gemini_Generated_Image_mpqbl4mpqbl4mpqb.webp')", backgroundSize: "cover" }}
        >

            <Card className="w-full max-w-sm bg-white shadow-md">
                <CardHeader className="text-center">
                    <Image src="/cortexcart-com-logo-home.png" alt="CortexCart Logo" width={320} height={100} className="mx-auto mb-4" />
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Sign in to access your dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {providers && Object.values(providers).map((provider) => (
                            // Filter out Pinterest and Facebook as sign-in options
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
        </div>
    );
}