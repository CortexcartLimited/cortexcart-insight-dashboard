'use client';

import React, { useState } from 'react';

const filterOptions = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'All Time', value: 'all' },
];

const DateFilter = ({ onFilterChange }) => {
  const [activeFilter, setActiveFilter] = useState('30d'); // Default to 'Last 30 Days'

  const handleButtonClick = (value) => {
    setActiveFilter(value);
    
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (value) {
      case '7d':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(today.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'all':
        // For 'All Time', we can send null values, and our API will ignore them.
        onFilterChange(null, null);
        return;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    // Format dates to YYYY-MM-DD
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    onFilterChange(formattedStartDate, formattedEndDate);
  };

  return (
    <div className="flex space-x-2 bg-gray-200 p-1 rounded-lg">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleButtonClick(option.value)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeFilter === option.value
              ? 'bg-white text-gray-900 shadow'
              : 'bg-transparent text-gray-600 hover:bg-white/60'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default DateFilter;
