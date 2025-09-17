'use client';

import { useState, useEffect, useCallback } from 'react';
import { XCircleIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';

// This sub-component remains the same
function DisplayImage({ image, onDelete, onSelect }) {
    // ... (No changes needed in this part)
}

export default function ImageManager({ onImageAdd }) {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/images');
            if (!response.ok) throw new Error('Failed to fetch images.');
            setImages(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    // --- FIX #1: Modify onImageAdd to include the file object ---
    // When a user selects a file from their computer, we'll immediately
    // pass it to the parent component for posting.
    const handleFileSelected = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file); // Set the file for uploading to the manager
            if (onImageAdd) {
                // Create a temporary local URL for the preview image
                const localImageUrl = URL.createObjectURL(file);
                // Pass an object containing both the preview URL and the raw file
                onImageAdd({ image_url: localImageUrl, file: file });
            }
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/api/images/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'File upload failed.');
            }

            // After uploading, refresh the list of images
            await fetchImages();
            
            setSelectedFile(null);
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = '';

        } catch (err) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };
    
    // --- FIX #2: Ensure selecting an existing image doesn't break things ---
    // When selecting an image that's already uploaded, we pass the URL but
    // explicitly set the file to null.
    const handleSelectExistingImage = (image) => {
        if (onImageAdd) {
            onImageAdd({ image_url: image.image_url, file: null });
        }
    };


    // ... (rest of the component)

    return (
        <div className="p-6 bg-white shadow-md rounded-lg mt-8 border border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Image Manager</h3>
            <div className="space-y-4 mb-4">
                 {/* ... (form for adding by URL remains the same) ... */}
                  <div className="flex items-center gap-2">
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        // Use the new handler here
                        onChange={handleFileSelected}
                        className="flex-grow w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <button 
                        onClick={handleFileUpload}
                        disabled={!selectedFile || isUploading}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center whitespace-nowrap"
                    >
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2"/>
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {isLoading ? <p>Loading images...</p> : (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pt-4 border-t">
                    {images.map(image => (
                        <DisplayImage 
                            key={image.id} 
                            image={image} 
                            onDelete={handleDeleteImage} 
                            // Use the new handler for selecting existing images
                            onSelect={handleSelectExistingImage} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}