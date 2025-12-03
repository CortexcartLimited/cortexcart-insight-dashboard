'use client';
import { useEffect, useState, Suspense } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

// --- Social Media Icons ---
const GoogleIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path><path d="M1 1h22v22H1z" fill="none"></path></svg>;
const FacebookIcon = () => <svg fill="#1877F2" viewBox="0 0 24 24" className="h-5 w-5 mr-3"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.77-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.028C18.343 21.128 22 16.991 22 12z"></path></svg>;
const TwitterIcon = () => <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3" fill="currentColor"><path d="M18.901 1.153h3.68l-8.042 9.167L24 22.847h-7.362l-6.189-7.07L3.68 22.847H0l8.608-9.83L0 1.153h7.521l5.474 6.208L18.901 1.153zm-.742 19.13L5.08 2.6H3.254l15.85 19.68h1.826z"></path></svg>;

function LoginForm() {
    const [providers, setProviders] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [error, setError] = useState(null);

    const providerDetails = {
        'google': { label: 'Google & YouTube', icon: <GoogleIcon /> },
        'twitter': { label: 'Twitter', icon: <TwitterIcon /> },
        'facebook': { label: 'Facebook', icon: <FacebookIcon /> },
    };

    useEffect(() => {
        setError(searchParams.get('error'));
        const fetchProviders = async () => {
            const res = await getProviders();
            setProviders(res);
        };
        fetchProviders();
    }, [searchParams]);

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
        <div className="light-mode-forced w-full max-w-sm">
            <Card className="w-full bg-white shadow-md text-gray-900">
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
                            <div className="flex justify-end mt-1">
                                <Link 
                                    href="https://cortexcart.com/forgot-password" 
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-full" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {providers && Object.values(providers).map((provider) => {
                            if (provider.id === 'credentials') return null;
                            const details = providerDetails[provider.id.toLowerCase()];
                            return (
                                <Button
                                    key={provider.id}
                                    onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                                    variant="outline"
                                    className="w-full flex justify-center items-center text-gray-950 font-medium py-2 rounded-full"
                                >
                                    {details?.icon}
                                    <span>Sign in with: {details?.label || provider.name}</span>
                                </Button>
                            );
                        })}
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-600">
                            Don&apos;t have an account?{' '}
                            <Link href="https://cortexcart.com/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </CardContent>
                
                <CardFooter className="justify-center border-t pt-4">
                     <p className="text-xs text-gray-400">App Version: {process.env.NEXT_PUBLIC_APP_VERSION}</p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src="/uploads/Gemini_Generated_Image_mpqbl4mpqbl4mpqb.webp"
                    alt="Background"
                    fill
                    priority={true}
                    className="object-cover object-center"
                    quality={80}
                />
            </div>

            {/* Login Form Wrapper */}
            <div className="relative z-10 w-full flex justify-center items-center flex-grow p-4">
                <Suspense fallback={<div className="text-white font-bold">Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>

            {/* Footer */}
            <footer className="relative z-10 w-full text-center p-4 bg-blue-950/80 text-gray-100 text-sm mt-auto backdrop-blur-sm">
                &copy; {new Date().getFullYear()} CortexCart. All Rights Reserved.
                <div className="flex justify-center space-x-4 mt-2">
                    <Link href="https://cortexcart.com/pages/terms" className="hover:underline text-white">Terms of Service</Link>
                    <Link href="https://cortexcart.com/pages/privacy" className="hover:underline text-white">Privacy Policy</Link>
                </div>
            </footer>
        </div>
    );
}