'use client';

import Link from 'next/link';
import { NotebookPen, VideoIcon, BookIcon, ListIcon } from 'lucide-react';
import Layout from '@/app/components/Layout';

const SupportPage = () => {
  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Support</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
  Here you can manage support tickets, read our knowledge base, view install guides, and watch helpful videos for assistance with using CortexCart.          </p>
        </div>
    {/* Knowledge Base */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50 ">
          <div className="flex items-center mb-4">
            <ListIcon className="h-8 w-8 text-teal-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Knowledge Base</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            Find answers to common questions and learn more about CortexCart features in our comprehensive knowledge base.
          </p>
          <Link href="/support/knowledgebase" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Go To Knowledge Base
          </Link>
        </div>

  {/* Help videos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50 ">
          <div className="flex items-center mb-4">
            <VideoIcon className="h-8 w-8 text-teal-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Help Videos</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
 View helpful videos on how to use CortexCart and or install the tracking script on your site.          </p>
          <Link href="/support/help-videos" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            View Support Videos
          </Link>
        </div>
  {/* install Guides */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50 ">
          <div className="flex items-center mb-4">
            <BookIcon className="h-8 w-8 text-teal-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Install Guides</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
 View install guides to walk you through a step by install of the script on your platform or site.          </p>
          <Link href="/support/install-guides" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Go To Install Guides
          </Link>
        </div>

        {/* Support Tickets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50 ">
          <div className="flex items-center mb-4">
            <NotebookPen className="h-8 w-8 text-yellow-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Support Tickets</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            Submit and manage your support tickets. Our team is ready to assist you with any issues or questions you may have.
          </p>
          <Link href="/support/support-tickets" className="w-full mt-auto bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Manage Tickets
          </Link>
        </div>
</div>
    </Layout>
);

};

export default SupportPage;
