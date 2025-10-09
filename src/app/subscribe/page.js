'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const PricingCard = ({ plan, onChoosePlan, isLoading }) => {
    const isCustom = plan.name.toLowerCase() === 'custom';

    return (
        <div className={`border rounded-lg p-8 flex flex-col ${plan.is_popular ? 'border-blue-600 border-2' : 'border-gray-200'}`}>
            <h3 className="text-2xl font-bold text-center">{plan.name}</h3>
            <p className="mt-2 text-gray-600 text-center h-16">{plan.description}</p>
            <div className="mt-6 text-center text-gray-900">
                {isCustom ? (
                    <span className="text-4xl font-extrabold">Custom</span>
                ) : (
                    <>
                        <span className="text-4xl font-extrabold">£{plan.price_monthly}</span>
                        <span className="text-base font-medium text-gray-500">/ month</span>
                    </>
                )}
            </div>
            <ul className="mt-6 space-y-4 text-gray-600 flex-grow">
                {plan.features.map(feature => (
                    <li key={feature} className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-8">
                 {isCustom ? (
                     <button onClick={() => router.push('/contact')} className={`w-full text-center px-6 py-3 font-semibold rounded-lg transition-colors text-white bg-gray-700 hover:bg-gray-800`}>
                        Contact Us
                    </button>
                 ) : (
                    <button onClick={() => onChoosePlan(plan.stripe_price_id)} disabled={isLoading || !plan.stripe_price_id} className={`w-full text-center px-6 py-3 font-semibold rounded-lg transition-colors text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400`}>
                        {isLoading ? <ArrowPathIcon className="h-5 w-5 mx-auto animate-spin" /> : 'Start 14-Day Free Trial'}
                    </button>
                 )}
            </div>
        </div>
    );
};


export default function SubscribePage() {
    const router = useRouter();
    const { status } = useSession();
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/api/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const res = await fetch('/api/plans');
                if (!res.ok) throw new Error('Failed to fetch plans');
                let data = await res.json();
                setPlans(data.filter(p => p.name.toLowerCase() !== 'beta'));
            } catch (err) {
                setError(err.message);
            }
        }
        fetchPlans();
    }, []);

    const handleChoosePlan = async (priceId) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            });
            const { url, message } = await res.json();
            if (!res.ok) throw new Error(message || 'Failed to create Stripe session.');
            router.push(url);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">Choose Your Plan</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-gray-600">
                        All plans start with a 14-day free trial. No credit card required to start, but will be required after trial ends.
                    </p>
                </div>
                {error && <p className="text-center text-red-500 mb-4">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                    {plans.map(plan => <PricingCard key={plan.id} plan={plan} onChoosePlan={handleChoosePlan} isLoading={isLoading} />)}
                </div>
            </div>
        </div>
    );
}
