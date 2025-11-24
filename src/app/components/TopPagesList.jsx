import React from 'react';

const TopPagesList = ({ pages = [] }) => {
  if (!pages || pages.length === 0) {
    return <div className="p-4 text-center text-gray-500">No page data available.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
          <tr>
            <th className="px-4 py-2">Page Path</th>
            <th className="px-4 py-2 text-right">Views</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page, index) => {
            // FIX: Check if path is exactly "/" and rename it
            const displayName = page.path === '/' ? 'Home Page' : page.path;
            
            // Optional: Also clean up the title if it's just the URL
            const displayTitle = page.title && page.title !== '(not set)' ? page.title : displayName;

            return (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium truncate max-w-[200px]" title={displayTitle}>
                  {displayTitle}
                  <div className="text-xs text-gray-400">{displayName}</div>
                </td>
                <td className="px-4 py-2 text-right">
                  {page.views?.toLocaleString() || 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TopPagesList;