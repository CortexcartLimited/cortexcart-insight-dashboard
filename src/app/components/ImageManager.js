'use client';

import { useState, useEffect, useCallback } from 'react';
import { XCircleIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';

// This sub-component is for displaying a single image
function DisplayImage({ image, onDelete, onSelect }) {
    const [imageError, setImageError] = useState(false);
    const handleError = () => setImageError(true);
    const handleDeleteClick = (e) => {
        e.stopPropagation(); 
        onDelete(image.id);
    };

    return (
        <div 
            onClick={() => onSelect(image)}
            className="relative group aspect-square bg-gray-200 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Select this image"
        >
            {imageError ? (
                <div className="flex items-center justify-center h-full w-full bg-red-100 text-red-600"><XCircleIcon className="h-8 w-8" /></div>
            ) : (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.image_url} alt={image.filename || 'User image'} className="w-full h-full object-cover" onError={handleError} />
                    <button onClick={handleDeleteClick} className="absolute bottom-1 right-1 bg-gray-900/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label="Delete image">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </>
            )}
        </div>
    );
}

export default function ImageManager({ onImageAdd }) {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
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

    
    // ✅ THIS WAS THE MISSING FUNCTION
    const handleDeleteImage = async (imageId) => {
        if (!confirm('Are you sure you want to permanently delete this image?')) {
            return;
        }
        setError('');
        try {
            const response = await fetch(`/api/images/${imageId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to delete image.');
            }
            // Refresh images after delete
            await fetchImages();
        } catch (err) {
            setError(err.message);
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
    
const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
        setSelectedFile(file); // Keep for uploading to the manager
        if (onImageAdd) {
            // Create a temporary URL for the preview and pass the raw file up
            const localImageUrl = URL.createObjectURL(file);
            onImageAdd({ image_url: localImageUrl, file: file });
        }
    }
};

    const handleSelectExistingImage = (image) => {
        if (onImageAdd) {
            onImageAdd({ image_url: image.image_url, file: null });
        }
    };

    return (
        <div className="p-6 bg-white shadow-md rounded-lg mt-8 border border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Image Manager</h3>
            <div className="space-y-4 mb-4">
                {/* Input for adding image by URL (functionality removed for brevity, can be added back) */}
                  <div className="flex items-center gap-2">
                    <input
    id="file-upload"
    type="file"
    accept="image/png, image/jpeg, image/gif, image/webp"
    onChange={handleFileSelected} // Use the new handler here
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
                            onSelect={handleSelectExistingImage} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}