'use client';

import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const UploadProgressModal = ({ isOpen, progress, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <PaperAirplaneIcon className="h-6 w-6 text-blue-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-800">Uploading Video</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">{message}</p>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="text-right text-sm font-medium text-gray-700">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

export default UploadProgressModal;