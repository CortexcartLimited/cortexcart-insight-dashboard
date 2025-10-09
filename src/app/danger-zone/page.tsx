'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Layout from '@/app/components/Layout';
import { ShieldAlert, Download } from 'lucide-react';

const DangerZonePage = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadData = async () => {
    setIsDownloading(true);
    setError('');
    try {
      const response = await fetch('/api/account/export-data');

      if (!response.ok) {
        let errorMessage = `A server error occurred: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cortexcart_account_data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Download Error Details:", err);
      
      // START: FIX FOR THE TYPE ERROR
      // We check if 'err' is an actual Error object before accessing '.message'
      if (err instanceof Error) {
        setError(`Download failed: ${err.message}`);
      } else {
        setError(`An unexpected error occurred.`);
      }
      // END: FIX FOR THE TYPE ERROR

    } finally {
      setIsDownloading(false);
    }
  };

  const handleAccountDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await signOut({ callbackUrl: '/api/account/delete', redirect: true });
    } catch (err) {
      setError('An error occurred during sign out. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Danger Zone</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Manage critical, irreversible actions related to your account.
      </p>

      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-gray-800/20 border border-red-300 dark:border-red-700 rounded-lg p-6 space-y-6">
          <div className="flex items-start">
            <ShieldAlert className="h-8 w-8 text-red-500 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-red-800 dark:text-red-300">Account Deletion & Data Export</h3>
              <p className="mt-2 text-red-700 dark:text-red-400">
                Please proceed with caution. The actions in this section are permanent and cannot be undone. Once your account is deleted, all of your data, including site settings, analytics, social connections, and personal information, will be permanently erased.
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-red-200 dark:border-red-800 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Download Your Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Export a JSON file containing all of your account and site data.</p>
            </div>
            <button
              onClick={handleDownloadData}
              disabled={isDownloading}
              className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Exporting...' : 'Download Data'}
            </button>
          </div>
          
          <div className="p-4 border-t border-red-200 dark:border-red-800 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Delete This Account</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">This action is permanent. All data will be lost.</p>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Are you absolutely sure?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm disabled:bg-red-400 disabled:cursor-not-allowed hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DangerZonePage;