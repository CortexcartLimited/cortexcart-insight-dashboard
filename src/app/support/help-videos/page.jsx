'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import Layout from '@/app/components/Layout';


const CustomModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (

    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 relative max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="mt-4">{children}</div>
      </div>
    </div>
    
  );
};

const videos = [
  {
    id: '1',
    title: 'Finding your GA4 Property ID',
    duration: '0.21',
    thumbnail: '/cortexcart-com-logo-videos.jpg', // Replace with actual thumbnail URL
    videoUrl: 'https://www.youtube.com/embed/cJ1rQ6OjuYM', // Replace with actual video URL
  },
  {
    id: '2',
    title: 'Connecting YouTube to CortexCart',
    duration: '0.14',
    thumbnail: '/cortexcart-com-logo-videos.jpg',
    videoUrl: 'https://www.youtube.com/embed/-bPbByoNEU0',
  },
  {
    id: '3',
    title: 'Connecting Twitter/X to CortexCart',
    duration: '0.17',
    thumbnail: '/cortexcart-com-logo-videos.jpg',
    videoUrl: 'https://www.youtube.com/embed/v2TedYtS0lQ',
  },
  {
    id: '4',
    title: 'connecting Facebook and Instagram to CortexCart',
    duration: '0.26',
    thumbnail: '/cortexcart-com-logo-videos.jpg',
    videoUrl: 'https://www.youtube.com/embed/7DkzkKPD1qY',
  },
    {
    id: '5',
    title: 'Posting to FaceBook on CortexCart',
    duration: '0.26',
    thumbnail: '/cortexcart-com-logo-videos.jpg',
    videoUrl: 'https://www.youtube.com/embed/VcBR_N-xq6k',
  },
   {
    id: '6',
    title: 'Posting to Twitter/x on CortexCart',
    duration: '0.14',
    thumbnail: '/cortexcart-com-logo-videos.jpg',
    videoUrl: 'https://www.youtube.com/embed/6hXKMSUDJik',
  },
];

const HelpVideosPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  const openModal = (videoUrl) => {
    setCurrentVideoUrl(videoUrl);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentVideoUrl('');
  };

  return (
    <Layout>
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Help Videos</h1>
      <p className="text-gray-600 mb-8">
        Here you'll find a collection of short video tutorials designed to help
        you connect your accounts and make the most of CortexCart's features.
        From setting up integrations to understanding key functionalities, these
        videos provide quick and easy guidance.
      </p>
      <div className="flex mb-6 justify-content-end">
        <a href="/support" className="text-blue-600 hover:underline">
          &larr; Back to Support
        </a>
      </div>
<span className="text-gray-500 block mb-4 bg-gray-50 p-2">Help Videos: 6</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => openModal(video.videoUrl)}
          >
            <div className="relative w-full h-40 bg-gray-200 flex items-center justify-center">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <Play className="absolute text-gray-900 text-5xl" />
              <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {video.title}
              </h3>
            </div>
          </div>
         
        ))}
      </div>

      <CustomModal isOpen={isOpen} onClose={closeModal}>
        {currentVideoUrl && (
          <iframe
            className="w-full h-full aspect-video"
            src={currentVideoUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        )}
      </CustomModal>
    </div>
     </Layout>
  );
};

export default HelpVideosPage;