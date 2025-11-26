'use client';
import { useEffect, useState, Suspense } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { FaFacebookF, FaGoogle, FaTwitter } from 'react-icons/fa';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input'; // Assuming you have this component, or use standard <input>
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginForm() {
    const [providers, setProviders] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [error, setError] = useState(null);

    const providerDetails = {
        'google': { label: 'Google & YouTube', icon: <FaGoogle className="h-5 w-5 mr-3" /> },
        'twitter': { label: 'Twitter', icon: <FaTwitter className="h-5 w-5 mr-3" /> },
        'facebook': { label: 'Facebook', icon: <FaFacebookF className="h-5 w-5 mr-3" /> },
    };

    useEffect(() => {
        setError(searchParams.get('error'));
        const fetchProviders = async () => {
            const res = await getProviders();
            setProviders(res);
        };
        fetchProviders();
    }, [searchParams]);

    // Handle Email/Password Login
    const handleCredentialsLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
            callbackUrl: '/dashboard',
        });

        setIsLoading(false);

        if (result?.error) {
            // Check for specific error messages like "verify your email"
            if (result.error === "CredentialsSignin") {
                 setError("Invalid email or password.");
            } else {
                 setError(result.error);
            }
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <Card className="w-full max-w-sm bg-white shadow-md">
            <CardHeader className="text-center">
                <Image src="/cortexcart-com-logo-home.png" alt="CortexCart Logo" width={320} height={100} className="mx-auto mb-4" />
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to access your dashboard</CardDescription>
                
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 mt-4 rounded text-sm text-left" role="alert">
                        <p className="font-semibold">Login Failed</p>
                        <p>{error}</p>
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {/* --- 1. Email/Password Login Form --- */}
                <form onSubmit={handleCredentialsLogin} className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <Input 
                            type="email" 
                            placeholder="Email address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            className="bg-white"
                        />
                        <Input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            className="bg-white"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                {/* --- Divider --- */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>

                {/* --- 2. Social Login Buttons --- */}
                <div className="space-y-3">
                    {providers && Object.values(providers).map((provider) => {
                        if (provider.id === 'credentials') return null;

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

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-600">
                        Don&apos;t have an account?{' '}
                        <Link href="/registration" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </CardContent>
            
            <CardFooter className="justify-center border-t pt-4">
                 <p className="text-xs text-gray-400">App Version: {process.env.NEXT_PUBLIC_APP_VERSION}</p>
            </CardFooter>
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
            {/* Footer remains the same */}
            <footer className="w-full text-center p-4 bg-blue-950 text-gray-100 text-sm">
                &copy; {new Date().getFullYear()} CortexCart. All Rights Reserved.
                <div className="flex justify-center space-x-4 mt-2">
                    <Link href="https://cortexcart.com/pages/terms" className="hover:underline">Terms of Service</Link>
                    <Link href="https://cortexcart.com/pages/privacy" className="hover:underline">Privacy Policy</Link>
                </div>
            </footer>
        </>
    );
}