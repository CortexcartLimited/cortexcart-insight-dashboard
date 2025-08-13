'use client';

import React from 'react';

const SettingsTabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div>
      <nav className="flex space-x-2 " aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`${
              activeTab === tab.name
                ? 'bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            } whitespace-nowrap py-2 px-4 rounded-md font-medium text-sm transition-colors`}
            aria-current={activeTab === tab.name ? 'page' : undefined}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default SettingsTabs;
