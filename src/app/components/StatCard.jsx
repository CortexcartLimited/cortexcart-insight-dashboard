// app/components/StatCard.jsx
import React from 'react';

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-200">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
        {/* We'll use simple text for icons for now, but you can use an icon library like Heroicons */}
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
};

export default StatCard;
