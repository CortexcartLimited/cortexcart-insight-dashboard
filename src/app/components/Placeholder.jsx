'use client';

import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const Placeholder = ({ title, description, icon: Icon = SparklesIcon }) => {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-6">
        <span
          className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
        >
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default Placeholder;
