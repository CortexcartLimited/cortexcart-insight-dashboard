'use client';

import Link from 'next/link';
import Image from 'next/image'; // Import the Image component from next/image
import { Cog, CreditCard, ShieldAlert, Zap, NotebookPen, LinkIcon} from 'lucide-react';
import Layout from '@/app/components/Layout';

const AccountPage = () => {
  return (
    <Layout>
      <Link href="/upgrade-plans">
      <Image src="/cortex cart-main-banner-upgrade.jpg" alt="Cortex Cart Upgrade Banner" width={1200} height={300} className="mb-8 rounded-lg shadow-md" />
</Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">My Account</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            Manage your account settings, billing information, and other preferences. Here you can update your personal details, review your subscription, and configure various aspects of your CortexCart experience.
          </p>
        </div>
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col  border border-grey-50 ">
          <div className="flex items-center mb-4">
            <Cog className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">General Settings</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            Manage your account details, site information, and display preferences. Here you can update your personal information and configure settings for your connected site.
          </p>
          <Link href="/general-settings" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Manage General Settings 
          </Link>
        </div>

        {/* Billing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50 ">
          <div className="flex items-center mb-4">
            <CreditCard className="h-8 w-8 text-green-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Billing</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            View your current plan, manage payment methods, and access your billing history. Keep your subscription active to ensure uninterrupted service.
          </p>
          <Link href="/billing-settings" className="w-full mt-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Manage Billing
          </Link>
        </div>

        {/* Upgrade */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50 ">
          <div className="flex items-center mb-4">
            <Zap className="h-8 w-8 text-purple-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Upgrade Plan</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            Unlock powerful features, increase your limits, and get priority support by upgrading your plan. Choose the plan that best fits your business needs.
          </p>
          <Link href="/upgrade-plans" className="w-full mt-auto bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            View Plans & Upgrade
          </Link>
        </div>
        {/* Useful links */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col  border border-grey-50 ">
          <div className="flex items-center mb-4">
            <LinkIcon className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Useful Links</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            We have a range of additional services that you may be interested in, for example: *Shopify, *Tide and more.. 
          </p>
           <Link href="/account/useful-links" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
             Useful Links
          </Link>
        </div>
      {/* GDPR Data Request */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50">
          <div className="flex items-center mb-4">
            <NotebookPen className="h-8 w-8 text-orange-500 mr-4 flex-shrink-0" /> {/* Using Cog for a generic settings/data icon */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">GDPR Data Request</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            Under GDPR, you have the right to request a copy of all personal data we hold about you. Click the button below to initiate this request.
          </p>
          <Link href="/gdpr" className="w-full mt-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Request My Data
          </Link>
        </div>
       
        {/* Other Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border border-grey-50">
          <div className="flex items-center mb-4">
            <Cog className="h-8 w-8 text-ogray-500 mr-4 flex-shrink-0" /> {/* Using Cog for a generic settings/data icon */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Are you looking for?</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
       <em> <b>Advanced Settings:</b></em> would you like to connect a social media account, connect a financial platform, connect Google analytics and possibly other advanced settings then please click the button below to manage or add these options.          </p>
          <Link href="/settings" className="w-full mt-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Go To Settings
          </Link>
        </div>
   {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-red-500/50 flex flex-col">
          <div className="flex items-center mb-4">
            <ShieldAlert className="h-8 w-8 text-red-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-red-500">Danger Zone</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            These actions are irreversible. Be certain before proceeding. Here you can permanently delete your account and all of its associated data.
          </p>
          <Link href="/danger-zone" className="w-full mt-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Go to Danger Zone
          </Link>
        </div>
       
 </div>
    </Layout>
  );
};

export default AccountPage;
