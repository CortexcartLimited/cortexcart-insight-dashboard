'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {ArrowLeftCircle} from 'lucide-react';

const PaymentSettingsPage = () => {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [autoPaymentEnabled, setAutoPaymentEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/stripe/manage-subscription');
        if (!res.ok) {
          const data = await res.json();
          // It's okay if they don't have a subscription, we just won't show the toggle
          if (res.status !== 404) {
             throw new Error(data.message || 'Could not fetch subscription status.');
          }
        } else {
            const data = await res.json();
            setAutoPaymentEnabled(data.autoPaymentEnabled);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscriptionStatus();
  }, []);
  
  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/create-portal-session');
      if (!res.ok) {
        throw new Error('Could not open billing portal. Do you have an active subscription?');
      }
      const { url } = await res.json();
      router.push(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPortalLoading(false);
    }
  };
  
  const handleToggleAutoPayment = async () => {
    const newStatus = !autoPaymentEnabled;
    setAutoPaymentEnabled(newStatus); // Optimistic update

    try {
      await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPaymentEnabled: newStatus }),
      });
    } catch (err) {
      setError('Failed to update setting. Please try again.');
      setAutoPaymentEnabled(!newStatus); // Revert on failure
    }
  };

  return (
    <Layout>
          <div className="flex items-center justify-between mb-4">

      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Payment Settings</h2>
              <Link href="/account" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
          <ArrowLeftCircle className="h-5 w-5 mr-2" /> Back to Account Page
        </Link>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Manage your billing information and subscription settings.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Billing Information</h3>
  
       
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Update your payment method and view your invoice history on our secure Stripe portal.
        </p>
        <button
          onClick={handleManageBilling}
          disabled={isPortalLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isPortalLoading ? 'Redirecting...' : 'Manage Billing & Invoices'}
        </button>
      </div>

      {!isLoading && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Subscription</h3>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-700 dark:text-gray-200">Enable Auto-Payment</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">If enabled, your subscription will automatically renew.</p>
            </div>
            {/* Simple Toggle Switch */}
            <button
                type="button"
                className={`${autoPaymentEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                role="switch"
                aria-checked={autoPaymentEnabled}
                onClick={handleToggleAutoPayment}
            >
                <span
                    aria-hidden="true"
                    className={`${autoPaymentEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PaymentSettingsPage;