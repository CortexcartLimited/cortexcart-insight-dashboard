// src/app/components/ImageManager.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TrashIcon, ArrowUpTrayIcon, PhotoIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

const DisplayImage = ({ image, onDelete, onSelect, isSelected }) => {
    const [imageError, setImageError] = useState(false);
    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(image.id);
    };

    return (
        <div 
            onClick={() => onSelect(image.image_url)}
            className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer"
        >
            {imageError ? (
                <div className="flex items-center justify-center h-full w-full bg-red-100 text-red-600"><XCircleIcon className="h-8 w-8" /></div>
            ) : (
                <>
                    <Image src={image.image_url} alt={image.filename || 'User upload'} width={150} height={150} className="w-full h-full object-cover" onError={() => setImageError(true)} />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity"></div>
                    <button onClick={handleDeleteClick} className="absolute bottom-1 right-1 bg-gray-900/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label="Delete image">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                    {isSelected && (
                        <div className="absolute inset-0 ring-4 ring-blue-500 rounded-md flex items-center justify-center bg-blue-500 bg-opacity-50">
                            <PhotoIcon className="h-8 w-8 text-white" />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default function ImageManager({ onImageSelect, selectedImageUrl }) {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

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

    const handleDeleteImage = async (imageId) => {
        if (!confirm('Are you sure you want to permanently delete this image?')) return;
        setError('');
        try {
            const response = await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete image.');
            await fetchImages();
            // If the deleted image was the selected one, unselect it
            if (images.find(img => img.id === imageId)?.image_url === selectedImageUrl) {
                onImageSelect(''); 
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleFileSelectedAndUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/images/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'File upload failed.');
            }

            const newImage = await response.json();
            setImages(prev => [newImage, ...prev]);
            onImageSelect(newImage.image_url);
            
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 bg-white shadow-md rounded-lg mt-8 border border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Image Manager</h3>
            <div className="space-y-4 mb-4">
                <div>
                    <input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileSelectedAndUpload}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center whitespace-nowrap"
                    >
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2"/>
                        {isUploading ? 'Uploading...' : 'Upload New Image'}
                    </button>
                </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Your Library</h4>
                {isLoading ? <p>Loading images...</p> : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 max-h-60 overflow-y-auto pt-2">
                        {images.map(image => (
                            <DisplayImage 
                                key={image.id} 
                                image={image} 
                                onDelete={handleDeleteImage} 
                                onSelect={onImageSelect}
                                isSelected={selectedImageUrl === image.image_url}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}