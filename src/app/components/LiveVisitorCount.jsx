'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const LiveVisitorCount = () => {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchLiveVisitors = async () => {
      // Only fetch if the session is authenticated and we have an email
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // Note: The API at /api/stats/live-visitors expects the email in the 'siteId' parameter
          const response = await fetch(`/api/stats/live-visitors?siteId=${session.user.email}`);
          const data = await response.json();
          if (response.ok) {
            setCount(data.liveVisitors || 0);
          } else {
            console.error("Failed to fetch live visitors:", data.message);
          }
        } catch (error) {
          console.error('Error fetching live visitor count:', error);
        }
      }
    };

    fetchLiveVisitors(); // Fetch immediately on load
    const interval = setInterval(fetchLiveVisitors, 30000); // And then every 30 seconds

    return () => clearInterval(interval);
  }, [session, status]); // Re-run the effect if the session status changes

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      <span>
        <span className="font-bold text-gray-700">{count}</span> live visitor{count === 1 ? '' : 's'}
      </span>
    </div>
  );
};

export default LiveVisitorCount;