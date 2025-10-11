'use client';

import { useState } from 'react';

const ManageBillingButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleBilling = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session.');
      }

      const { url } = await response.json();
      // Redirect the user to the Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBilling}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300"
    >
      {isLoading ? 'Loading...' : 'Manage Billing & Subscription'}
    </button>
  );
};

export default ManageBillingButton;