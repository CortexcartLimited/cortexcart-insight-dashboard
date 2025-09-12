'use client';


import Layout from '@/app/components/Layout';
import StripePricingTable from '@/app/components/PricingTable';
import Link from 'next/link';
import {ArrowLeftCircle, Zap} from 'lucide-react';


const UpgradePlansPage = () => {
  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Zap className="h-6 w-6 mr-3" />
          <span className="text-lg font-semibold">Current Plan: Beta</span>
        </div>
        <Link href="/billing-settings" className="text-white hover:text-blue-100 text-sm">
          Manage Billing
        </Link>
      </div>

<div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Upgrade Plan</h2>
                <Link href="/account" className="flex items-center text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
          <ArrowLeftCircle className="h-5 w-5 mr-2" /> Back to Account Page
        </Link>
      </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
          Upgrade to a plan that suits you best. Choose the plan that best fits your business needs.
        </p>
      <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
<StripePricingTable pricing-table-id="prctbl_1S6SiyF6XLY4flzwTVKRY8CN"
publishable-key="pk_live_WYJzenOkJZzqDr0BmsGnlddg">
</StripePricingTable>

      </Layout>
  );
};

export default UpgradePlansPage;
