// src/app/components/ImageManager.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { PhotoIcon, XCircleIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

const ImageManager = ({ onImageSelect, onImageRemove }) => {
    const [userImages, setUserImages] = useState([]);
    const [selectedImageUrl, setSelectedImageUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Fetch existing images from the server when the component loads
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await fetch('/api/images');
                if (!response.ok) {
                    throw new Error('Could not fetch images.');
                }
                const images = await response.json();
                setUserImages(images);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchImages();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setIsUploading(true);

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPG or PNG images are allowed.');
            setIsUploading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/images/upload', {
                method: 'POST',
                body: formData,
            });

            const newImage = await response.json();

            if (!response.ok) {
                throw new Error(newImage.message || 'File upload failed.');
            }

            // Add the new image to the top of our list and select it
            setUserImages(prevImages => [newImage, ...prevImages]);
            handleSelectImage(newImage.image_url);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    // When an image is selected (either new or existing)
    const handleSelectImage = (imageUrl) => {
        setSelectedImageUrl(imageUrl);
        onImageSelect(imageUrl); // This sends the URL to the parent "staging area"
    };

    const handleRemoveImage = () => {
        setSelectedImageUrl(null);
        onImageRemove();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-white space-y-4">
            <h3 className="text-sm font-semibold">Image Manager</h3>
            
            {/* --- UPLOAD SECTION --- */}
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/jpeg, image/png, image/jpg"
                    disabled={isUploading}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                    <ArrowUpOnSquareIcon className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload New Image'}
                </button>
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>

            {/* --- IMAGE GALLERY --- */}
            <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-2">Your Uploads</h4>
                {isLoading ? (
                    <p className="text-xs text-gray-500">Loading images...</p>
                ) : userImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {userImages.map((image) => (
                            <div key={image.id} className="relative cursor-pointer group" onClick={() => handleSelectImage(image.image_url)}>
                                <Image 
                                    src={image.image_url} 
                                    alt="User upload" 
                                    width={100} 
                                    height={100} 
                                    className="w-full h-full object-cover rounded-md"
                                />
                                {selectedImageUrl === image.image_url && (
                                    <div className="absolute inset-0 bg-blue-500 bg-opacity-50 ring-2 ring-blue-700 rounded-md flex items-center justify-center">
                                        <PhotoIcon className="h-6 w-6 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No images uploaded yet.</p>
                )}
            </div>
        </div>
    );
};

export default ImageManager;