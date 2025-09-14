'use client';

import Script from 'next/script';
import { useSession } from 'next-auth/react';

const StripePricingTable = () => {
  const { data: session, status } = useSession();

  // 1. Get these values from your Stripe Dashboard
  const PRICING_TABLE_ID = 'prctbl_1S6r3LF6XLY4flzw2vZp4OW6'; // Replace with your Pricing Table ID
  const PUBLISHABLE_KEY = 'pk_live_WYJzenOkJZzqDr0BmsGnlddg'; // Replace with your Publishable Key

  // Show a loading state while we get the user's session
  if (status === 'loading') {
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" style={{ height: '500px' }}>
            <span className="sr-only">Loading Pricing Table...</span>
        </div>
    );
  }

  return (
    <>
      <Script async src="https://js.stripe.com/v3/pricing-table.js"></Script>
      <stripe-pricing-table
        pricing-table-id={PRICING_TABLE_ID}
        publishable-key={PUBLISHABLE_KEY}
        // This is the most important part! It tells Stripe which user is checking out.
        // Your webhook uses this email to update the correct user's plan.
        client-reference-id={session?.user?.email || ''}
      ></stripe-pricing-table>
    </>
  );
};

export default StripePricingTable;