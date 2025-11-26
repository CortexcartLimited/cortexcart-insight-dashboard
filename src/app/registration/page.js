'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { CheckCircleIcon } from '@heroicons/react/24/solid';

const StepIndicator = ({ currentStep, totalSteps }) => (
    <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <li key={step} className={`relative ${step !== totalSteps ? 'pr-8 sm:pr-20' : ''}`}>
                    {step < currentStep ? (
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-blue-600" />
                            </div>
                            <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-900">
                                <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                <span className="sr-only">Step {step}</span>
                            </a>
                        </>
                    ) : step === currentStep ? (
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-gray-200" />
                            </div>
                            <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white" aria-current="step">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
                                <span className="sr-only">Step {step}</span>
                            </a>
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-gray-200" />
                            </div>
                            <a href="#" className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
                                <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" aria-hidden="true" />
                                <span className="sr-only">Step {step}</span>
                            </a>
                        </>
                    )}
                </li>
            ))}
        </ol>
    </nav>
);

const RegistrationPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        address: '',
        postalCode: '',
        siteName: '',
        siteUrl: '',
        currency: 'USD',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/api/auth/signin');
        } else if (session?.user?.email) {
            setFormData(prev => ({ ...prev, email: session.user.email, fullName: session.user.name || '' }));
        }
    }, [session, status, router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Something went wrong.');
            }

            router.push('/dashboard');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') {
        return <Layout><div>Loading...</div></Layout>;
    }

    const currencyOptions = [
        { code: 'USD', symbol: '$', name: 'United States Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
    ];

    return (
       
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Welcome to CortexCart
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-gray-500">
                        Let&apos;s get your account set up. A few details and you&apos;ll be on your way.
                    </p>
                </div>

                <div className="mt-12">
                    <StepIndicator currentStep={step} totalSteps={3} />
                </div>

                <div className="mt-12 p-8">
                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    This information helps us personalize your experience and is used for account verification. We will never share or sell your personal data.
                                </p>
                                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-4">
                                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    Address Information
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Please provide your billing address. This information is used for invoicing and compliance.
                                </p>
                                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-4">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                        <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal Code</label>
                                        <input type="text" name="postalCode" id="postalCode" value={formData.postalCode} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    Site Information
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Tell us about your e-commerce site. This helps us tailor our insights to your business.
                                </p>
                                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-4">
                                        <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">Site Name</label>
                                        <input type="text" name="siteName" id="siteName" value={formData.siteName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                    <div className="sm:col-span-6">
                                        <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700">Site URL</label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                                https://
                                            </span>
                                            <input type="url" name="siteUrl" id="siteUrl" value={formData.siteUrl} onChange={handleChange} required className="flex-1 block w-full rounded-none rounded-r-md px-3 py-2 border border-gray-300" placeholder="www.example.com" />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Preferred Currency</label>
                                        <select id="currency" name="currency" value={formData.currency} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                                            {currencyOptions.map((option) => (
                                                <option key={option.code} value={option.code}>
                                                    {option.name} ({option.symbol})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="mt-6 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="mt-8 pt-5 border-t border-gray-200">
                            <div className="flex justify-between">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                )}
                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="ml-auto inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="ml-auto inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Registering...' : 'Complete Registration'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
       
    );
};

export default RegistrationPage;