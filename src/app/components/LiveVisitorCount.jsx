'use client';

import React from 'react';

const LiveVisitorCount = ({ count }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      <span className="text-sm font-medium text-gray-700">
        <span className="font-bold">{count}</span> {count === 1 ? 'visitor' : 'visitors'} live
      </span>
    </div>
  );
};

export default LiveVisitorCount;
