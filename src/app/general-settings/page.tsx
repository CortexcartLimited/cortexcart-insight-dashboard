'use client';

import { Cog, PoundSterling, Users, ArrowLeftCircle} from 'lucide-react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';

const GeneralSettingsPage = () => {
  return (
    <Layout>
         <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">General Settings</h2>
        <Link href="/account" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
          <ArrowLeftCircle className="h-5 w-5 mr-2" /> Back to Account Page
        </Link>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">Manage your account details, site information, and display preferences. Here you can update your personal information and configure settings for your connected site.
          </p>   
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
   
        {/* General Settings - Site Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col  border border-grey-50 ">
          <div className="flex items-center mb-4">
                        <Cog className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" /> {/* Using Cog for a generic settings/data icon */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Site Details</h2>
                </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            To help this app function we need to ask you for the website URL for example: (https://mysite.com) 
          </p>
          <Link href="/site-url" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Add / Edit Site URL 
          </Link>
          </div>
                  {/* General Settings - Personal Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col  border border-grey-50 ">
          <div className="flex items-center mb-4">
                        <Users className="h-8 w-8 text-green-500 mr-4 flex-shrink-0" /> {/* Using Cog for a generic settings/data icon */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Personal Details</h2>
                </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            To help offer a personalized experience we need collect your personal details, such as: Name, Address and Email Address.
          </p>
          <Link href="/personal-details" className="w-full mt-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
           Add / Edit Personal Details
          </Link>

          </div>
                            {/* General Settings  - Currency */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col  border border-grey-50 ">
          <div className="flex items-center mb-4">
                        <PoundSterling className="h-8 w-8 text-purple-500 mr-4 flex-shrink-0" /> {/* Using Cog for a generic settings/data icon */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Currency</h2>
                </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            Set you country currency, this helps us provide a better analytic experience based on your country.  
          </p>
                    <Link href="/personal-currency" className="w-full mt-auto bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Add / Edit Currency
          </Link>

          </div>
      </div>    
    </Layout>
  );
};

export default GeneralSettingsPage;
