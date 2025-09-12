'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid'; // Import the icon


// Currency options available for the user to select
const currencyOptions = [
    { code: 'USD', symbol: '$', name: 'United States Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
    // You can add more currencies here if needed
];

const PersonalCurrencyPage = () => {
  // State for form inputs, loading, and messages
  const [currency, setCurrency] = useState('USD'); // Default to USD
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: '', isError: false });
  const router = useRouter();

  // Fetch current currency setting when the component loads
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/site-settings');
        if (res.ok) {
          const data = await res.json();
          setCurrency(data.currency || 'USD'); // Use fetched value or default
        } else {
          throw new Error('Failed to fetch current currency setting.');
        }
      } catch (error) {
        setFormMessage({ text: error.message, isError: true });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handler to save the updated settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormMessage({ text: '', isError: false });
    try {
      const res = await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency }), // Send only the currency
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'An error occurred while saving.');
      }
      
      setFormMessage({ text: 'Currency saved successfully!', isError: false });
      // Redirect back to the general settings page
      setTimeout(() => router.push('/general-settings'), 2000);

    } catch (error) {
      setFormMessage({ text: error.message, isError: true });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Display a loading state while fetching initial data
  if (isLoading) {
    return (
      <Layout>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Currency</h2>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">Loading currency setting...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Currency</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
        Select the default currency for your analytics and reporting.
      </p>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Default Currency</h3>
        <form onSubmit={handleSaveSettings}>
          <div className="mb-4">
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
          {/* START: Updated Select Box Styling */}
            <div className="relative mt-1">
              <select 
                id="currency" 
                name="currency"
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                className="appearance-none w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {currencyOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name} ({opt.code})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            {/* END: Updated Select Box Styling */}
          </div>
          
          <div className="flex justify-end items-center mt-6">
            {formMessage.text && (
              <p className={`text-sm mr-4 ${formMessage.isError ? 'text-red-600' : 'text-green-600'}`}>
                {formMessage.text}
              </p>
            )}
            <Link
              href="/general-settings"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-4"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Currency'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default PersonalCurrencyPage;