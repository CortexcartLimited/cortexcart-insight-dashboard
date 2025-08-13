import React from 'react';

const SkeletonChart = ({ className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md animate-pulse ${className}`}>
      {/* Title Skeleton */}
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      
      {/* Content Skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
};

export default SkeletonChart;
