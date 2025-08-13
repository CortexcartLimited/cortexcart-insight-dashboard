// src/app/components/ChartContainer.jsx
import React from 'react';

/**
 * A reusable container component for displaying charts.
 * It provides a consistent card-style wrapper with a title and an optional description.
 * @param {string} title - The title to display at the top of the chart card.
 * @param {string} [description] - Optional text to display below the title.
 * @param {React.ReactNode} children - The actual chart component to be rendered inside the container.
 */
const ChartContainer = ({ title, description, children }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md  border border-gray-200">
      
      <h3 className="text-xl font-semibold text-gray-700">
        {title}
      </h3>
      
      {/* Conditionally render the description if it exists */}
      {description && (
        <p className="mt-1 text-sm text-gray-500 -mt-3 mb-4">
          {description}
        </p>
      )}
      
      <div className="h-96">
        {children}
      </div>

    </div>
  );
};

export default ChartContainer;
