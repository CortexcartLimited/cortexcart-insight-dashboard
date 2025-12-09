'use client';

import Link from 'next/link';
import { ChartBarIcon, UsersIcon, PuzzlePieceIcon, CodeBracketIcon, CogIcon, QuestionMarkCircleIcon} from '@heroicons/react/24/solid';
import Layout from '@/app/components/Layout';


const SettingsPage = () => {
  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Settings, Integrations & Platforms</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
Manage your site integrations, Platforms and Widget.</p>
        </div>
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col  border border-grey-50 ">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" /> 
           <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Google Analytics Settings</h2>
             </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            Manage your Google analytics 4 property, connect google analytics to see current live stats on your site using your GA4 Property.
          </p>
          <Link href="/settings/integrations" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Manage GA4 Properties 
          </Link>
        </div>

        {/* Billing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50 ">
          <div className="flex items-center mb-4">
 <UsersIcon className="h-8 w-8 text-green-500 mr-4 flex-shrink-0" />
             <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Social Connections</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            View your current social platform account connections, add a connection and view the stats within your CortexCart Dashboard and social analytics.
          </p>
          <Link href="/settings/social-connections" className="w-full mt-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Manage Social Connections
          </Link>
        </div>

        {/* Upgrade */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50 ">
          <div className="flex items-center mb-4">
           <PuzzlePieceIcon className="h-8 w-8 text-purple-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Platforms</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
Manage and connect/disconnect your platforms for example: Mailchimp, QuickBooks and more to have these platforms send analytics to the dashboard.
          </p>
          <Link href="/settings/platforms" className="w-full mt-auto bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Manage Platforms
          </Link>
        </div>

      {/* GDPR Data Request */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50">
          <div className="flex items-center mb-4">
             <CodeBracketIcon className="h-8 w-8 text-orange-500 mr-4 flex-shrink-0" />            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">My Tracking Widget</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
View, copy and paste your Widget code here that is specific to you and your website only. Need help installing your widget code try the <Link href="/install" className="text-blue-500">install guide</Link> for detailed platform install help.
          </p>
          <Link href="/settings/widget" className="w-full mt-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Get my widget embed code
          </Link>
        </div>
        {/* Other Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50">
          <div className="flex items-center mb-4">
            <CogIcon className="h-8 w-8 text-ogray-500 mr-4 flex-shrink-0" /> {/* Using Cog for a generic settings/data icon */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Are you looking for?</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
       <em> <b>Account Settings:</b></em> would you like to update your name, address, email etc.. Click the button below to manage these settings         </p>
          <Link href="/account" className="w-full mt-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Go To My Account
          </Link>
        </div>
         {/* Other Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50">
          <div className="flex items-center mb-4">
            <QuestionMarkCircleIcon className="h-8 w-8 text-ogray-500 mr-4 flex-shrink-0" /> {/* Using Cog for a generic settings/data icon */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Need more help?</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
       <em> <b>Try our <Link href="support/knowledgebase" className="text-blue-500">Knowledgebase</Link></b></em> We have sections for all areas of this app, we also have videos to walk you through each step of using our app. Need to talk, raise a <Link href="/support" className="text-blue-500">support ticket</Link> depending on your plan you can get a response within 24 hours</p>
          
        </div>
  
       
 </div>
    </Layout>
  );
};

export default SettingsPage;
