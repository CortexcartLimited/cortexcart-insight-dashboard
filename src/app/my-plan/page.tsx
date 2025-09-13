'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown, Zap } from 'lucide-react';

// START: FIX FOR THE TYPE ERROR
// 1. Define a type that describes the shape of our plan data
type PlanData = {
  planName: string;
  status: string;
  renewalDate: string | null;
};
// END: FIX FOR THE TYPE ERROR

const MyPlanPage = () => {
  // 2. Tell useState that our state will be 'PlanData' or 'null'
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPlan = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/billing/my-plan');
        if (!res.ok) {
          throw new Error('Could not fetch your plan details.');
        }
        const data = await res.json();
        setPlanData(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const handleManageSubscription = async () => {
    setIsRedirecting(true);
    setError('');
    try {
        const res = await fetch('/api/stripe/create-portal-session');
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Could not open the billing portal.');
        }
        const { url } = await res.json();
        router.push(url);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unexpected error occurred.');
        }
        setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">My Plan</h2>
        <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-6"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">My Plan</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">View your current plan and manage your subscription.</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {planData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
              <Crown className="h-6 w-6 mr-2" />
              {planData.planName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Status: <span className={`font-semibold ${planData.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>{planData.status}</span>
            </p>
            {planData.renewalDate && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {planData.status === 'Canceled' ? 'Expires on:' : 'Renews on:'} {planData.renewalDate}
                </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0">
            {planData.planName === 'Beta' ? (
              <Link href="/subscribe" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                <Zap className="h-5 w-5 mr-2" />
                Upgrade Plan
              </Link>
            ) : (
              <button 
                onClick={handleManageSubscription}
                disabled={isRedirecting}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isRedirecting ? 'Redirecting...' : 'Manage Subscription'}
              </button>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyPlanPage;