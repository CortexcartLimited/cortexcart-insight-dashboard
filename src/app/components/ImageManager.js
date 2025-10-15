// src/app/components/ImageManager.js
'use client';

import { useState, useRef } from 'react';
import { PhotoIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

const ImageManager = ({ onImageSelect, onImageRemove }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setIsUploading(true);

        // --- FIX: File validation now includes PNG ---
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPG or PNG images are allowed.');
            setIsUploading(false);
            return;
        }

        // --- FIX: Upload the file to the server ---
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/images/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'File upload failed.');
            }

            const permanentUrl = result.image_url;
            setSelectedImage(permanentUrl);
            onImageSelect(permanentUrl); // Pass the permanent URL to the parent

        } catch (err) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        onImageRemove();
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset the file input
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-sm font-semibold mb-2">Image Manager</h3>
            
            {selectedImage ? (
                <div className="relative group">
                    <Image src={selectedImage} alt="Selected preview" width={200} height={120} className="w-full h-auto rounded-md" />
                    <button
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                    >
                        <XCircleIcon className="h-5 w-5" />
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/jpeg, image/png"
                            disabled={isUploading}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isUploading}
                            className="flex-1 text-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md disabled:opacity-50"
                        >
                            {isUploading ? 'Uploading...' : 'Choose File'}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
            )}
        </div>
    );
};

export default ImageManager;