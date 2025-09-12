'use client';

import { useState, ChangeEvent } from 'react'; // Import ChangeEvent for typing
import Layout from '@/app/components/Layout';
import { BookUser, FileText, ShieldCheck, Mail } from 'lucide-react';

const GDPRPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', request: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: '', type: '' });

  // START: FIX FOR THE TYPE ERROR
  // We add the type 'ChangeEvent<...>' to the event parameter 'e'.
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  // END: FIX FOR THE TYPE ERROR
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/gdpr-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'An unknown error occurred.');
      }
      
      setFormMessage({ text: result.message, type: 'success' });
      setFormData({ name: '', email: '', request: '' });
      setTimeout(() => {
          setIsModalOpen(false);
          setFormMessage({ text: '', type: '' });
      }, 3000);

    } catch (error) {
        if (error instanceof Error) {
            setFormMessage({ text: error.message, type: 'error' });
        } else {
            setFormMessage({ text: 'An unexpected error occurred.', type: 'error'});
        }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-4">
          <ShieldCheck className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Data Protection Rights (GDPR)</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Under the General Data Protection Regulation (GDPR) in the UK and EU, you have rights over your personal data. We are committed to upholding these rights. Below is a summary of your entitlements and how you can exercise them.
        </p>

        {/* GDPR Rights Summary */}
        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <BookUser className="h-6 w-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Right of Access</h3>
              <p className="text-gray-600 dark:text-gray-300">You have the right to request a copy of the personal data we hold about you.</p>
            </div>
          </div>
          <div className="flex items-start">
            <FileText className="h-6 w-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Other Key Rights</h3>
              <p className="text-gray-600 dark:text-gray-300">You also have the right to data rectification (correcting inaccurate data), erasure (deleting your data), restriction of processing, and data portability.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Mail className="h-5 w-5 mr-2" />
            Make a Data Request
          </button>
        </div>
      </div>

      {/* Request Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg border dark:border-gray-700">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">GDPR Data Request Form</h3>
            {formMessage.text ? (
              <div className={`p-4 rounded-md text-center ${formMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                {formMessage.text}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    type="text" id="name" name="name"
                    value={formData.name} onChange={handleInputChange} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <input
                    type="email" id="email" name="email"
                    value={formData.email} onChange={handleInputChange} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="request" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Request</label>
                  <textarea
                    id="request" name="request" rows={4}
                    value={formData.request} onChange={handleInputChange} required
                    placeholder="Please describe your data request. For example: 'I request a copy of all my personal data.' or 'I request the deletion of my account.'"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:bg-blue-400 disabled:cursor-not-allowed hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GDPRPage;