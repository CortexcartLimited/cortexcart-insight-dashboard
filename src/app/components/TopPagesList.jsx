import React from 'react';

const TopPagesList = ({ pages = [], index }) => {
  if (pages.length === 0) {
    return <p className="text-sm text-gray-500">No page view data available for this period.</p>;
  }

  return (
    <div className="flow-root">
      <ul role="list" className="divide-y divide-gray-200">
        {pages.map((page, index) => (
          <li key={`${page.page}-${index}`} className="py-3 sm:py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <p title={page.page} className="text-sm font-medium text-gray-900 truncate">
                  {page.page}
                </p>
              </div>
              <div className="inline-flex items-center text-base font-semibold text-gray-900">
                {page.views.toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopPagesList;
