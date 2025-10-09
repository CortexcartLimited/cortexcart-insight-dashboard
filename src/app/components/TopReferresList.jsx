import React from 'react';

// Helper to extract the hostname from a full URL for a cleaner display
const getHostname = (url) => {
    if (!url || url === '(Direct)') {
        return '(Direct)';
    }
    try {
        // Remove common search engine subdomains for cleaner display
        return new URL(url).hostname.replace(/^(www\.|m\.|l\.)/, '');
    } catch (e) {
        // If the URL is invalid (e.g., from a mobile app), show it as is
        return url;
    }
};

const TopReferrersList = ({ referrers = [] }) => {
  if (referrers.length === 0) {
    return <p className="text-sm text-gray-500">No referrer data available for this period.</p>;
  }

  return (
    <div className="flow-root">
      <ul role="list" className="divide-y divide-gray-200">
        {referrers.map((ref, index) => (
          <li key={index} className="py-3 sm:py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <p title={ref.referrer} className="text-sm font-medium text-gray-900 truncate">
                  {getHostname(ref.referrer)}
                </p>
              </div>
              <div className="inline-flex items-center text-base font-semibold text-gray-900">
                {ref.views.toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopReferrersList;
