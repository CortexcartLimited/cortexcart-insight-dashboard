'use client';

import { useState, useEffect } from 'react';

const SubscriptionDetails = () => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/billing/my-plan');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to fetch subscription details.');
        }
        const data = await response.json();
        setSubscription(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (isLoading) {
    return <div className="p-6 bg-gray-100 rounded-lg animate-pulse">Loading subscription details...</div>;
  }

  if (error) {
    return <div className="p-6 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  if (!subscription) {
    return null; // Or show a "No active subscription" message
  }

  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    trialing: 'bg-blue-100 text-blue-800',
    past_due: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Current Plan</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Plan:</span>
          <span className="font-medium text-gray-800">{subscription.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium text-gray-800">{subscription.price} / {subscription.interval}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status:</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[subscription.status] || statusStyles.canceled}`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </span>
        </div>
        {subscription.status === 'active' || subscription.status === 'trialing' ? (
          <div className="flex justify-between">
            <span className="text-gray-600">{subscription.status === 'trialing' ? 'Trial ends on:' : 'Next renewal:'}</span>
            <span className="font-medium text-gray-800">{subscription.current_period_end}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SubscriptionDetails;