'use client';

import { useState } from 'react';

const ManageBillingButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBilling = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create billing portal session.');
      }

      // Redirect the user to the Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleBilling}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isLoading ? 'Loading...' : 'Manage Billing & Subscription'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ManageBillingButton;