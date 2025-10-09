'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SiteUrlPage = () => {
  // State for form inputs, loading, and messages
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: '', isError: false });
  const router = useRouter();

  // Fetch current site settings when the component loads
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/site-settings');
        if (res.ok) {
          const data = await res.json();
          setSiteName(data.site_name || '');
          setSiteUrl(data.site_url || '');
        } else {
          throw new Error('Failed to fetch current site settings.');
        }
      } catch (error) {
        setFormMessage({ text: error.message, isError: true });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []); // The empty array ensures this runs only once on mount

  // Handler to save the updated settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormMessage({ text: '', isError: false });
    try {
      const res = await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, siteUrl }), // Send only the relevant data
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'An error occurred while saving.');
      }
      
      setFormMessage({ text: 'Settings saved successfully!', isError: false });
      // Optionally, redirect the user back to the main settings page after success
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Site Details</h2>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">Loading your site information...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Site Details</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
        To help this app function we need to ask you for the website URL for example: (https://mysite.com)
      </p>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Site Information</h3>
        <form onSubmit={handleSaveSettings}>
          <div className="mb-4">
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site Name</label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., My Awesome Store"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site URL</label>
            <input
              type="url"
              id="siteUrl"
              name="siteUrl"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., https://www.mysite.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              required
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
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SiteUrlPage;