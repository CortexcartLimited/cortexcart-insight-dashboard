'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PersonalDetailsPage = () => {
  // State for form inputs, loading, and messages
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: '', isError: false });
  const router = useRouter();

  // Fetch current settings when the component loads
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/site-settings');
        if (res.ok) {
          const data = await res.json();
          setFullName(data.full_name || '');
          setEmail(data.email || '');
          setAddress(data.address || '');
          setPostalCode(data.postal_code || '');
        } else {
          throw new Error('Failed to fetch current personal details.');
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
        body: JSON.stringify({ fullName, email, address, postalCode }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'An error occurred while saving.');
      }
      
      setFormMessage({ text: 'Details saved successfully!', isError: false });
      // Redirect back to the general settings page after a short delay
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Personal Details</h2>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">Loading your personal details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Personal Details</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
        Update your personal information below. This information may be used for billing and account management.
      </p>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Information</h3>
        <form onSubmit={handleSaveSettings}>
          {/* Full Name Input */}
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., jane.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
           {/* Address Input */}
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., 123 Main Street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
           {/* Postal Code Input */}
          <div className="mb-4">
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Postal/Zip Code</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., SW1A 0AA"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
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
              {isSaving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default PersonalDetailsPage;