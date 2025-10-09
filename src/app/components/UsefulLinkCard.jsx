// src/app/components/UsefulLinkCard.jsx
import React from 'react';

const UsefulLinkCard = ({ title, description, imageUrl, affiliateLink }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105">
      <div className="flex-shrink-0 h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-700 p-4">
        <img className="max-h-full max-w-full object-contain" src={imageUrl} alt={`${title} logo`} />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">{description}</p>
        <a
          href={affiliateLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-block text-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Learn More
        </a>
      </div>
    </div>
  );
};

export default UsefulLinkCard;