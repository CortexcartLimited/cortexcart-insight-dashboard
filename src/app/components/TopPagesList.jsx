import React from 'react';

const TopPagesList = ({ pages = [] }) => {
  if (!pages || pages.length === 0) {
    return <p className="text-sm text-gray-500">No page view data available for this period.</p>;
  }

  return (
    <div className="flow-root">
      <ul role="list" className="divide-y divide-gray-200">
        {pages.map((item, index) => {
          // 1. Handle both 'path' and 'page' keys to prevent blank lines
          const rawPath = item.path || item.page || 'Unknown';
          
          // 2. Rename "/" to "Home Page"
          const displayPath = rawPath === '/' ? 'Home Page' : rawPath;

          return (
            <li key={`${rawPath}-${index}`} className="py-3 sm:py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 min-w-0">
                  <p title={rawPath} className="text-sm font-medium text-gray-900 truncate">
                    {displayPath}
                  </p>
                </div>
                <div className="inline-flex items-center text-base font-semibold text-gray-900">
                  {item.views?.toLocaleString() || 0}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TopPagesList;