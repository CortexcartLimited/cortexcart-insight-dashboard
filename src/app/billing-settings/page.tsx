'use client';

import Link from 'next/link';
import {  CreditCardIcon, ArrowLeftCircle} from 'lucide-react';
import Layout from '@/app/components/Layout';

const BillingDetailsPage = () => {
  return (
    <Layout>
                   <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Billing Settings</h2>
             <Link href="/account" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
          <ArrowLeftCircle className="h-5 w-5 mr-2" /> Back to Account Page
        </Link>
        </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                 Manage payment methods, and access your billing history. Keep your subscription active to ensure uninterrupted service.
           </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col  border border-grey-50 ">
          <div className="flex items-center mb-4">
            <CreditCardIcon className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Payment Details</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
            Manage your payment details: Here you can update your personal payment information and configure auto-payment via the Stripe Card Payment system.
          </p>
          <Link href="/payment-settings" className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            Manage Payment Settings 
          </Link>
        </div>
   {/* Invoices */}
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col  border border-grey-50 ">
          <div className="flex items-center mb-4">
            <CreditCardIcon className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">View your Invoices</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
           View your invoices and statements relating to your subscription.
          </p>
          <Link href="/billing-invoices" className="w-full mt-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-center">
            View Invoices 
          </Link>
        </div>


       

        
        </div>

    </Layout>
  );
};

export default BillingDetailsPage;
