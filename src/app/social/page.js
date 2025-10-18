'use client';
import UploadProgressModal from '@/app/components/UploadProgressModal'
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '@/app/components/Layout';
import { ArrowPathIcon, SparklesIcon, StarIcon, CalendarIcon, PaperAirplaneIcon, InformationCircleIcon, CakeIcon, UserIcon, GlobeAltIcon, ClipboardDocumentIcon, ChartBarIcon, PencilSquareIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import ImageManager from '@/app/components/ImageManager';
import Ga4LineChart from '@/app/components/Ga4LineChart';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import Image from 'next/image';
import RecentPostsCard from '@/app/components/RecentPostsCard';
import EngagementByPlatformChart from '@/app/components/EngagementByPlatformChart';
import PlatformPostsChart from '@/app/components/PlatformPostsChart';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import MailchimpTabContent from '@/app/components/social/MailchimpTabContent';
import dynamic from 'next/dynamic';
import CalenderModal from '@/app/components/CalanderModal';


const PinterestIcon = (props) => (
    <svg {...props} fill="#E60023" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.14 2.686 7.66 6.357 8.94.02-.19.03-.4.05-.61l.33-1.4a.12.12 0 0 1 .1-.1c.36-.18 1.15-.56 1.15-.56s-.3-.91-.25-1.79c.06-.9.65-2.12 1.46-2.12.68 0 1.2.51 1.2 1.12 0 .68-.43 1.7-.65 2.64-.18.78.38 1.42.92 1.42 1.58 0 2.63-2.1 2.63-4.22 0-1.8-.95-3.26-2.7-3.26-2.12 0-3.32 1.58-3.32 3.16 0 .6.22 1.25.5 1.62.03.04.04.05.02.13l-.15.65c-.05.2-.14.24-.32.08-1.05-.9-1.5-2.3-1.5-3.82 0-2.78 2.04-5.38 5.8-5.38 3.1 0 5.2 2.25 5.2 4.67 0 3.1-1.95 5.42-4.62 5.42-.9 0-1.75-.46-2.05-1l-.52 2.1c-.24 1-.92 2.25-.92 2.25s-.28.1-.32.08c-.46-.38-.68-1.2-.55-1.88l.38-1.68c.12-.55-.03-1.2-.5-1.52-1.32-.9-1.9-2.6-1.9-4.22 0-2.28 1.6-4.3 4.6-4.3 2.5 0 4.2 1.8 4.2 4.15 0 2.5-1.55 4.5-3.8 4.5-.75 0-1.45-.38-1.7-.82l-.28-.9c-.1-.4-.2-.8-.2-1.22 0-.9.42-1.68 1.12-1.68.9 0 1.5.8 1.5 1.88 0 .8-.25 1.88-.58 2.8-.25.7-.5 1.4-.5 1.4s-.3.12-.35.1c-.2-.1-.3-.2-.3-.4l.02-1.12z"/></svg>
);
const YouTubeIcon = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
  </svg>
);
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

const PLATFORMS = {
    x: {
        name: 'X (Twitter)',
        maxLength: 280,
        icon: (props) => ( <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M13.682 10.623 20.239 3h-1.64l-5.705 6.44L7.65 3H3l6.836 9.753L3 21h1.64l6.082-6.885L16.351 21H21l-7.318-10.377zM14.78 13.968l-.87-1.242L6.155 4.16h2.443l4.733 6.742.87 1.242 7.03 9.98h-2.443l-5.045-7.143z" /></svg>),
        placeholder: "What is on your mind? or need help ask AI to help you generate your feelings into more engaging content including relevant tags", // FIX: Escaped apostrophe
        disabled: false,
        color: '#000000',
        apiEndpoint: '/api/social/post' // Assuming this is correct for X, might need updating to /api/social/x/create-post
    },
    facebook: {
        name: 'Facebook',
        maxLength: 5000,
        icon: (props) => (<svg {...props} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.77-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.028C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>),
        placeholder: "What is on your mind? or need help ask AI to help you generate your feelings into more engaging content including relevant tags", // FIX: Escaped apostrophe
        disabled: false,
        color: '#1877F2',
        apiEndpoint: '/api/social/facebook/create-post'
    },
    pinterest: {
        name: 'Pinterest',
        maxLength: 500,
        icon: PinterestIcon,
        placeholder: 'Add a Pin description or Generate with AI including pin tags...',
        disabled: false,
        color: '#E60023',
        apiEndpoint: '/api/social/pinterest/post',
    },
    instagram: {
        name: 'Instagram',
        maxLength: 2200,
        icon: (props) => (<svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c1.74 0 2.28.01 3.07.05 1.07.05 1.81.22 2.42.46a4.88 4.88 0 0 1 1.76 1.15 4.88 4.88 0 0 1 1.15 1.76c.24.6.41 1.35.46 2.42.04.79.05 1.33.05 3.07s-.01 2.28-.05 3.07c-.05 1.07-.22 1.81-.46 2.42a4.88 4.88 0 0 1-1.15 1.76 4.88 4.88 0 0 1-1.76 1.15c-.6.24-1.35.41-2.42.46-.79.04-1.33.05-3.07.05s-2.28-.01-3.07-.05c-1.07-.05-1.81-.22-2.42-.46a4.88 4.88 0 0 1-1.76-1.15 4.88 4.88 0 0 1-1.15-1.76c-.24-.6-.41-1.35-.46-2.42a83.3 83.3 0 0 1-.05-3.07s.01-2.28.05-3.07c.05-1.07.22-1.81.46-2.42a4.88 4.88 0 0 1 1.15-1.76A4.88 4.88 0 0 1 6.5 2.51c.6-.24 1.35-.41 2.42-.46.79-.04 1.33-.05 3.07-.05M12 0C9.26 0 8.74.01 7.9.06 6.63.11 5.6.31 4.7.7a6.88 6.88 0 0 0-2.47 2.47c-.4 1-.6 1.93-.65 3.2-.04.84-.05 1.36-.05 4.1s.01 3.26.05 4.1c.05 1.27.25 2.2.65 3.2a6.88 6.88 0 0 0 2.47 2.47c1 .4 1.93.6 3.2.65.84.04 1.36.05 4.1.05s3.26-.01 4.1-.05c1.27-.05 2.2-.25 3.2-.65a6.88 6.88 0 0 0 2.47-2.47c.4-1 .6-1.93.65-3.2.04-.84.05-1.36-.05-4.1s-.01-3.26-.05-4.1c-.05-1.27-.25-2.2-.65-3.2A6.88 6.88 0 0 0 19.3.7c-1-.4-1.93-.6-3.2-.65-.84-.04-1.36-.05-4.1-.05zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /></svg>),
        placeholder: 'Add a Image description or Generate with AI including tags...',
        disabled: false,
        color: '#E4405F',
        apiEndpoint: '/api/social/instagram/accounts/post'
    },
      youtube: {
        name: 'YouTube',
        maxLength: Infinity,
        icon: YouTubeIcon,
        placeholder: "Enter a video description or generate with AI including video tags...",
        disabled: false,
        color: '#FF0000',
        apiEndpoint: '/api/social/youtube/upload-video' // Assuming this is correct
    }
};

const SocialNav = ({ activeTab, setActiveTab }) => {
    const tabs = [{ name: 'Composer', icon: PencilSquareIcon }, { name: 'Analytics', icon: ChartBarIcon }, { name: 'Schedule', icon: CalendarIcon }, { name: 'Demographics', icon: InformationCircleIcon },  { name: 'Mailchimp', icon: ClipboardDocumentIcon }];
    return (
        <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button key={tab.name} onClick={() => setActiveTab(tab.name)}
                        className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.name ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <tab.icon className="mr-2 h-5 w-5" /> {tab.name}
                    </button>
                ))}
                <Link href="/settings/social-connections" className="ml-auto flex items-center py-4 px-1 font-medium text-sm transition-colors text-gray-500 hover:text-gray-700">
                    <Cog6ToothIcon className="h-6 w-6" /> Social Settings
                </Link>
            </nav>
        </div>
    );
};

const ComposerTabContent = ({ scheduledPosts, onPostScheduled, postContent, setPostContent, selectedPlatform, setSelectedPlatform, instagramAccounts, pinterestBoards, loading, ...props }) => {

    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
    const [scheduleTime, setScheduleTime] = useState('10:00');
    const [isPosting, setIsPosting] = useState(false);
    // REMOVED: const [postImages, setPostImages] = useState([]);
    const [postStatus, setPostStatus] = useState({ message: '', type: '' });
    const [error, setError] = useState('');
    const [selectedInstagramId, setSelectedInstagramId] = useState('');
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [pinTitle, setPinTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoTitle, setVideoTitle] = useState('');
    const [privacyStatus, setPrivacyStatus] = useState('private');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMessage, setUploadMessage] = useState('');
    const [selectedImageUrl, setSelectedImageUrl] = useState(''); // Keep this

    useEffect(() => {
        // Set default selection when data becomes available
        if (selectedPlatform === 'pinterest' && pinterestBoards && pinterestBoards.length > 0 && !selectedBoardId) {
            setSelectedBoardId(pinterestBoards[0].board_id);
        }
        if (selectedPlatform === 'instagram' && instagramAccounts && instagramAccounts.length > 0 && !selectedInstagramId) {
            console.log("Setting default Instagram ID:", instagramAccounts[0]?.instagram_user_id);
            setSelectedInstagramId(instagramAccounts[0].instagram_user_id);
             // Verify state right after setting (may show previous value due to async nature)
             setTimeout(() => console.log("selectedInstagramId state after default set:", selectedInstagramId), 0);
        }
    }, [selectedPlatform, pinterestBoards, instagramAccounts, selectedBoardId, selectedInstagramId]);

    const currentPlatform = PLATFORMS[selectedPlatform];

    // Handles both YouTube uploads and standard posts
    const handleSubmit = () => {
        if (selectedPlatform === 'youtube') {
            handleUploadToYouTube();
        } else {
            handlePostNow();
        }
    };

    const handleUploadToYouTube = async () => {
        if (!videoFile || !videoTitle) {
            setPostStatus({ message: 'A video file and title are required.', type: 'error' });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadMessage('Preparing upload...');

        try {
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('title', videoTitle);
            formData.append('description', postContent);
            formData.append('privacyStatus', privacyStatus);

            // Use selectedImageUrl for thumbnail if available
            if (selectedImageUrl) {
                const response = await fetch(selectedImageUrl);
                if (!response.ok) throw new Error('Failed to load thumbnail image.');
                const blob = await response.blob();
                formData.append('thumbnail', blob, 'thumbnail.jpg'); // Adjust filename as needed
            }

            const result = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                // ... (rest of XHR logic is fine) ...
                 xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        setUploadProgress(percentComplete);
                        setUploadMessage('Uploading video file...');
                    }
                });

                xhr.onload = () => {
                    setUploadMessage('Processing video and setting thumbnail...');
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(xhr.statusText));
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Upload failed. Please check your network connection.'));
                };

                xhr.open('POST', currentPlatform.apiEndpoint, true); // Use apiEndpoint from PLATFORMS
                xhr.send(formData);
            });


            setPostStatus({ message: result.message, type: 'success' });
            setVideoFile(null);
            setVideoTitle('');
            setPostContent('');
            setSelectedImageUrl(''); // Clear selected image

        } catch (err) {
            setPostStatus({ message: err.message, type: 'error' });
            console.error("YouTube upload process failed:", err);
        } finally {
            setIsUploading(false);
        }
    };

    // REMOVED: handleImageAdded function
    // REMOVED: handleRemoveImage function

    const handleGeneratePost = async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);
        setError('');
        try {
            const res = await fetch('/api/ai/generate-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic,
                    platform: currentPlatform.name,
                    maxLength: currentPlatform.maxLength
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to generate post.');
            setPostContent(result.postContent);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- MODIFIED handlePostNow ---
    const handlePostNow = async () => {
        if (!postContent && selectedPlatform !== 'pinterest') { // Pinterest might only need image/title/board
             setPostStatus({ message: 'Post content is required.', type: 'error' });
             return;
        }

        setIsPosting(true);
        setPostStatus({ message: '', type: '' });

        // Get apiEndpoint from the current platform config
        let apiEndpoint = currentPlatform?.apiEndpoint;
        let requestBody = {};

        if (selectedPlatform === 'pinterest') {
            console.log("Checking Pinterest requirements: Board=", selectedBoardId, "Image=", selectedImageUrl, "Title=", pinTitle);
            if (!selectedBoardId || !selectedImageUrl || !pinTitle) {
                setPostStatus({ message: 'A board, image, and title are required for Pinterest.', type: 'error' });
                setIsPosting(false);
                return;
            }
            requestBody = {
                boardId: selectedBoardId,
                imageUrl: selectedImageUrl,
                title: pinTitle,
                description: postContent // Description is optional but good to include
            };
        } else if (selectedPlatform === 'instagram') {
            console.log("Attempting Instagram post. selectedInstagramId:", selectedInstagramId);
            console.log("Checking image URL from selectedImageUrl:", selectedImageUrl); // Added log
            if (!selectedImageUrl || !selectedInstagramId) { // Check selectedImageUrl directly
                setPostStatus({ message: 'An image and a selected Instagram account are required.', type: 'error' });
                setIsPosting(false);
                return;
            }
            requestBody = {
                instagramUserId: selectedInstagramId,
                imageUrl: selectedImageUrl,
                caption: postContent,
            };
        } else if (selectedPlatform === 'youtube') {
           // YouTube uses handleSubmit -> handleUploadToYouTube, so this shouldn't be reached via Post Now
           console.warn("handlePostNow called for YouTube, should use handleSubmit.");
           setIsPosting(false);
           return;
        }
        else { // For platforms like X, Facebook
            requestBody = {
                platform: selectedPlatform, // Include platform for generic endpoints if needed
                content: postContent,
                imageUrl: selectedImageUrl || null, // Use selectedImageUrl (can be null/empty)
            };
        }

        // Check if apiEndpoint is defined for the selected platform
        if (!apiEndpoint) {
            console.error("API endpoint is not defined for platform:", selectedPlatform);
            setPostStatus({ message: `Cannot post: API endpoint not configured for ${currentPlatform?.name || selectedPlatform}.`, type: 'error'});
            setIsPosting(false);
            return;
        }

        console.log(`Sending POST request to ${apiEndpoint} with body:`, requestBody);

        try {
            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const result = await res.json();
            // Check based on status code first, then look for error/message in body
            if (!res.ok) {
                 console.error(`API Error (${res.status}):`, result);
                 throw new Error(result.error || result.message || `Request failed with status ${res.status}`);
            }

            setPostStatus({ message: `Post published to ${currentPlatform.name} successfully!`, type: 'success' });
            setPostContent('');
            setSelectedImageUrl(''); // Clear the selected image URL
        } catch (err) {
            setPostStatus({ message: err.message, type: 'error' });
            console.error(`Error posting to ${selectedPlatform}:`, err);
        } finally {
            setIsPosting(false);
        }
    };
    // --- END MODIFIED handlePostNow ---


    const handleSchedulePost = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const scheduledAt = moment(`${scheduleDate} ${scheduleTime}`).toISOString();

            if (moment(scheduledAt).isBefore(moment())) {
                throw new Error('You cannot schedule a post in the past.');
            }

            // Ensure content exists unless it's Pinterest (which might rely on image/title)
             if (!postContent && selectedPlatform !== 'pinterest') {
                  throw new Error('Post content is required to schedule.');
             }
             // Ensure image exists if platform requires it (Instagram, Pinterest)
             if ((selectedPlatform === 'instagram' || selectedPlatform === 'pinterest') && !selectedImageUrl) {
                 throw new Error(`An image is required to schedule a post for ${currentPlatform.name}.`);
             }
              // Ensure Pinterest has board and title
             if (selectedPlatform === 'pinterest' && (!selectedBoardId || !pinTitle)) {
                  throw new Error('A board and title are required to schedule a Pin.');
             }
             // Ensure Instagram has account selected
              if (selectedPlatform === 'instagram' && !selectedInstagramId) {
                  throw new Error('An Instagram account must be selected to schedule.');
             }


            const response = await fetch('/api/social/schedule/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    content: postContent,
                    imageUrl: selectedImageUrl || null, // Send null if no image selected
                    scheduledAt: scheduledAt,
                    hashtags: [], // Maintained from previous fix
                    // Include platform-specific fields if needed by backend schedule API
                    boardId: selectedPlatform === 'pinterest' ? selectedBoardId : null,
                    pinTitle: selectedPlatform === 'pinterest' ? pinTitle : null,
                    instagramUserId: selectedPlatform === 'instagram' ? selectedInstagramId : null,
                    // videoUrl, videoTitle, privacyStatus for YouTube if scheduling is supported
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to schedule the post.');
            }
            onPostScheduled(); // This should trigger refresh/close modal etc.
             // Clear form after successful schedule
             setPostContent('');
             setSelectedImageUrl('');
             setPinTitle('');
             // Optionally reset date/time or leave them for next post
             setScheduleDate(moment().add(1, 'day').format('YYYY-MM-DD'));
             setScheduleTime('10:00');

        } catch (err) {
            setError(err.message);
        }
    };

    const isOverLimit = currentPlatform && postContent.length > currentPlatform.maxLength;

    return (
        <>
            <UploadProgressModal
                isOpen={isUploading}
                progress={uploadProgress}
                message={uploadMessage}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex items-center border-b pb-4 overflow-x-auto whitespace-nowrap">
                        {Object.values(PLATFORMS).map(platform => {
                            // Decide if the platform should be shown in the composer tabs
                            // Example: Hide Pinterest if you handle it separately or it needs special UI
                            // if (platform.name === 'Pinterest') return null;

                            const Icon = platform.icon;
                            const platformKey = platform.name.toLowerCase().split(' ')[0].replace('(twitter)', ''); // Get 'x', 'facebook', etc.
                            return (
                                <button
                                    key={platform.name}
                                    onClick={() => setSelectedPlatform(platformKey)}
                                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md mr-2 ${selectedPlatform === platformKey ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    disabled={platform.disabled} // Use disabled flag from PLATFORMS
                                >
                                    {Icon && <Icon className="h-5 w-5 mr-2" />} {platform.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Platform Specific Inputs */}
                    {selectedPlatform === 'youtube' && (
                         <div className="mt-4 space-y-4 p-4 border bg-gray-50 rounded-lg">
                             <div>
                                 <label htmlFor="video-file" className="block text-sm font-medium text-gray-700">Select Video File <span className="text-red-500">*</span></label>
                                 <input type="file" id="video-file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                             </div>
                             <div>
                                 <label htmlFor="video-title" className="block text-sm font-medium text-gray-700">Video Title <span className="text-red-500">*</span></label>
                                 <input type="text" id="video-title" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                             </div>
                             {/* Thumbnail Selection via ImageManager - handled below */}
                              <div>
                                 <label className="block text-sm font-medium text-gray-700">Video Thumbnail (Optional)</label>
                                 <p className="text-xs text-gray-500">Select an image below using the Image Manager.</p>
                                 {/* ImageManager handles selection, preview shown below */}
                             </div>
                             <div>
                                 <label htmlFor="privacy-status" className="block text-sm font-medium text-gray-700">Privacy</label>
                                 <select id="privacy-status" value={privacyStatus} onChange={(e) => setPrivacyStatus(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm">
                                     <option value="private">Private</option>
                                     <option value="unlisted">Unlisted</option>
                                     <option value="public">Public</option>
                                 </select>
                             </div>
                         </div>
                    )}
                    {selectedPlatform === 'pinterest' && (
                        <div className="mt-4 space-y-4">
                             <div>
                                <label htmlFor="board-select" className="block text-sm font-medium text-gray-700">Choose a board <span className="text-red-500">*</span></label>
                                <select
                                    id="board-select"
                                    value={selectedBoardId}
                                    onChange={(e) => setSelectedBoardId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    disabled={loading || !pinterestBoards || pinterestBoards.length === 0}
                                    required
                                >
                                     <option value="" disabled>-- Select a Board --</option>
                                    {loading ? (
                                        <option disabled>Loading boards...</option>
                                    ) : !Array.isArray(pinterestBoards) || pinterestBoards.length === 0 ? (
                                        <option disabled>No boards found or not connected</option>
                                    ) : (
                                        pinterestBoards.map((board) => (
                                            <option key={board.board_id} value={board.board_id}>
                                                {board.board_name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="pin-title" className="block text-sm font-medium text-gray-700">Pin Title <span className="text-red-500">*</span></label>
                                <input type="text" id="pin-title" value={pinTitle} onChange={(e) => setPinTitle(e.target.value)} placeholder="Add a title" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Pin Image <span className="text-red-500">*</span></label>
                                <p className="text-xs text-gray-500">Select an image below using the Image Manager.</p>
                                {/* ImageManager handles selection, preview shown below */}
                             </div>
                        </div>
                    )}
                    {selectedPlatform === 'instagram' && (
                         <div className="mt-4 space-y-4">
                             <div>
                                <label htmlFor="ig-account-select" className="block text-sm font-medium text-gray-700">Post to Instagram Account <span className="text-red-500">*</span></label>
                                <select
                                    id="ig-account-select"
                                    value={selectedInstagramId}
                                    onChange={(e) => setSelectedInstagramId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    required
                                >
                                    <option value="" disabled>-- Select Account --</option>
                                    {instagramAccounts.length === 0 ? (
                                        <option disabled>No Instagram accounts connected.</option>
                                    ) : (
                                        instagramAccounts.map((acc) => (
                                            <option key={acc.instagram_user_id} value={acc.instagram_user_id}>
                                                {acc.username}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Image <span className="text-red-500">*</span></label>
                                 <p className="text-xs text-gray-500">Select an image below using the Image Manager.</p>
                                {/* ImageManager handles selection, preview shown below */}
                             </div>
                         </div>
                    )}

                   {/* --- IMAGE PREVIEW AREA --- */}
                    {selectedImageUrl && (
                        <div className="mt-4 mb-4 relative group">
                            <p className="text-xs text-gray-500 mb-1">Attached Image:</p>
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                <Image src={selectedImageUrl} alt="Selected image preview" layout="fill" objectFit="cover" />
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedImageUrl('')} // Clears the image
                                className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                            >
                                <XCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    {/* Main Content Text Area */}
                    <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder={currentPlatform?.placeholder || "Write your post content here..."}
                        className="mt-4 w-full h-64 p-4 border border-gray-200 rounded-md"
                        maxLength={currentPlatform?.maxLength} // Apply maxLength
                    />

                    {/* Character Count and Post Buttons */}
                    <div className="mt-4 flex justify-between items-center">
                        <span className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                            {postContent.length}/{currentPlatform?.maxLength < Infinity ? currentPlatform?.maxLength : '∞'}
                        </span>
                        <div className="flex items-center gap-x-2">
                             {/* Add Copy Button Functionality if needed */}
                            {/* <button className="flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-50"><ClipboardDocumentIcon className="h-5 w-5 mr-2" />Copy</button> */}
                            <button
                                onClick={handleSubmit}
                                // More robust disabled check
                                disabled={
                                    isPosting || isUploading ||
                                    (selectedPlatform !== 'pinterest' && !postContent) || // Content required unless Pinterest
                                    isOverLimit ||
                                    (selectedPlatform === 'instagram' && (!selectedImageUrl || !selectedInstagramId)) ||
                                    (selectedPlatform === 'pinterest' && (!selectedImageUrl || !selectedBoardId || !pinTitle)) ||
                                    (selectedPlatform === 'youtube' && (!videoFile || !videoTitle))
                                }
                                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                             >
                                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                                {isPosting || isUploading ? 'Processing...' : (selectedPlatform === 'youtube' ? 'Upload Now' : 'Post Now')}
                            </button>
                        </div>
                    </div>

                    {/* Post Status Message */}
                    {postStatus.message && (
                        <div className={`mt-4 text-sm p-2 rounded-md text-center ${postStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {postStatus.message}
                        </div>
                    )}

                    {/* Schedule Form */}
                    <form onSubmit={handleSchedulePost} className="mt-6 border-t pt-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Schedule Post</h4>
                        {error && <p className="text-sm text-red-600 mb-2">{error}</p>} {/* Show schedule error here */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700">Date</label>
                                <input type="date" id="scheduleDate" name="scheduleDate" onChange={(e) => setScheduleDate(e.target.value)} value={scheduleDate} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" min={moment().format('YYYY-MM-DD')} required/>
                            </div>
                            <div>
                                <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700">Time</label>
                                <input type="time" id="scheduleTime" name="scheduleTime" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required/>
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                type="submit"
                                // More robust disabled check for scheduling
                                disabled={
                                    isPosting || isUploading ||
                                     (selectedPlatform !== 'pinterest' && !postContent) ||
                                     isOverLimit || !scheduleDate || !scheduleTime ||
                                     (selectedPlatform === 'instagram' && (!selectedImageUrl || !selectedInstagramId)) ||
                                     (selectedPlatform === 'pinterest' && (!selectedImageUrl || !selectedBoardId || !pinTitle))
                                     // Add YouTube check if scheduling is supported
                                }
                                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <CalendarIcon className="h-5 w-5 mr-2" />Schedule Post
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* AI Assistant */}
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4 border border-gray-200">
                        <h3 className="font-semibold text-lg">AI Assistant</h3>
                        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'New Summer T-Shirt Sale'" className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"/>
                        <button onClick={handleGeneratePost} disabled={isGenerating || !topic.trim() || !currentPlatform} className="w-full flex items-center justify-center px-4 py-2 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            {isGenerating ? 'Generating...' : `Generate for ${currentPlatform?.name || 'Platform'}`}
                        </button>
                         {/* Display AI error */}
                         {/* Consider moving schedule error from above to here if preferred */}
                    </div>

                    {/* Upcoming Posts */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Upcoming Posts</h3>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                           {/* Keep existing upcoming posts logic */}
                           {scheduledPosts.length > 0 ? scheduledPosts.slice(0, 5).map(post => {
                                const postPlatformKey = post.resource?.platform; // Get platform key directly
                                const platformConfig = PLATFORMS[postPlatformKey]; // Find config
                                const Icon = platformConfig?.icon;
                                return (
                                    <div key={post.id} className={`p-3 bg-gray-50 rounded-lg border-l-4`} style={{ borderColor: platformConfig?.color || '#9CA3AF' }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {Icon && <Icon className="h-4 w-4 text-gray-600" />}
                                                <span className="font-semibold text-sm text-gray-800">{platformConfig?.name || postPlatformKey}</span>
                                            </div>
                                            <span className="text-xs text-blue-600 font-medium">{moment(post.start).format('MMM D, h:mm a')}</span>
                                        </div>
                                        {/* Ensure post.title exists and is a string before splitting */}
                                        <p className="text-sm text-gray-600 truncate mt-1">{post.title && typeof post.title === 'string' ? post.title.split(': ')[1] : 'No title'}</p>
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-center text-gray-500 py-4">No posts scheduled.</p>
                            )}
                        </div>
                    </div>

                    {/* Image Manager */}
                    <ImageManager
                         onImageSelect={(url) => {
                            console.log("Image selected in ImageManager:", url); // Added log
                            setSelectedImageUrl(url);
                        }}
                        selectedImageUrl={selectedImageUrl}
                        // Pass any other necessary props to ImageManager
                    />
                </div>
            </div>
        </>
    );
};


// --- Rest of the file (AnalyticsTabContent, ScheduleTabContent, etc.) remains the same ---
// --- Ensure SocialMediaManagerPage correctly fetches data and passes props ---

const AnalyticsTabContent = () => {
    // ... (Existing Analytics Code) ...
     const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSyncing, setIsSyncing] = useState({ x: false, facebook: false, pinterest: false, youtube: false});
    const [syncMessage, setSyncMessage] = useState('');
    const [syncMessageType, setSyncMessageType] = useState('info');
  // Define the colors for each platform to match your sync buttons
       const platformColors = {
        x: 'rgba(0, 0, 0, 0.7)',
        facebook: 'rgba(37, 99, 235, 0.7)', // blue-600
        pinterest: 'rgba(220, 38, 38, 0.7)', // red-600
        youtube: 'rgba(239, 68, 68, 0.7)', // red-500
        default: 'rgba(107, 114, 128, 0.7)' // gray-500
    };


     const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/social/analytics');
            if (!res.ok) throw new Error('Failed to load analytics data.');
            setData(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleSync = async (platform) => {
        setIsSyncing(prev => ({ ...prev, [platform]: true }));
        setSyncMessage('');
        try {
            const res = await fetch(`/api/social/${platform}/sync`, { method: 'POST' });
            const result = await res.json();
            if (!res.ok) {
                setSyncMessageType('error');
                throw new Error(result.message || `An unknown error occurred during ${platform} sync.`);
            }
            setSyncMessageType('success');
            setSyncMessage(result.message);
            fetchAnalytics();
        } catch (err) {
            setSyncMessageType('error');
            setSyncMessage(err.message);
        } finally {
            setIsSyncing(prev => ({ ...prev, [platform]: false }));
        }
    };

    if (isLoading) return <p className="text-center p-8">Loading analytics...</p>;
    if (error) return <p className="text-center p-8 text-red-600">{error}</p>;

    const { stats = {}, dailyReach = [], platformStats = [] } = data || {};

    const reachChartData = (dailyReach || []).map(item => ({ date: item.date, pageviews: item.reach, conversions: 0 }));

    const platformLabels = (platformStats || []).map(p => p.platform);
      const backgroundColors = (platformStats || []).map(p => platformColors[p.platform] || platformColors.default);

     const postsByPlatformData = {
        labels: platformStats.map(item => PLATFORMS[item.platform]?.name || item.platform),
        datasets: [{
            label: 'Number of Posts',
            data: platformStats.map(item => item.postCount),
             backgroundColor: backgroundColors, // Use the dynamic color array
            //borderColor: borderColor,         // Use the dynamic border color array
            borderWidth: 1,
        }]
    };

    const engagementByPlatformData = {
        labels: platformLabels,
        datasets: [{
            label: 'Engagement Rate',
            data: (platformStats || []).map(p => p.engagementRate),
              backgroundColor: backgroundColors, // Use the dynamic color array
           // borderColor: borderColor,         // Use the dynamic border color array
        }],
    };

    return (
        <div className="space-y-8">
            {/* Card 1: Overview and Sync Buttons */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Analytics Overview</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                         <button onClick={() => handleSync('x')} disabled={isSyncing.x} className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:bg-gray-400">
                            <ArrowPathIcon className={`-ml-0.5 mr-1.5 h-5 w-5 ${isSyncing.x ? 'animate-spin' : ''}`} />
                            {isSyncing.x ? 'Syncing...' : 'Sync with X'}
                        </button>
                        <button onClick={() => handleSync('facebook')} disabled={isSyncing.facebook} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-blue-400">
                            <ArrowPathIcon className={`-ml-0.5 mr-1.5 h-5 w-5 ${isSyncing.facebook ? 'animate-spin' : ''}`} />
                            {isSyncing.facebook ? 'Syncing...' : 'Sync with Facebook'}
                        </button>
                        <button onClick={() => handleSync('pinterest')} disabled={isSyncing.pinterest} className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:bg-red-400">
                            <ArrowPathIcon className={`-ml-0.5 mr-1.5 h-5 w-5 ${isSyncing.pinterest ? 'animate-spin' : ''}`} />
                            {isSyncing.pinterest ? 'Syncing...' : 'Sync with Pinterest'}
                        </button>
                        <button onClick={() => handleSync('youtube')} disabled={isSyncing.youtube} className="inline-flex items-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:bg-red-400">
                            <ArrowPathIcon className={`-ml-0.5 mr-1.5 h-5 w-5 ${isSyncing.youtube ? 'animate-spin' : ''}`} />
                            {isSyncing.youtube ? 'Syncing...' : 'Sync with YouTube'}
                        </button>


                </div>
                {syncMessage && (
                    <div className={`text-center text-sm p-3 rounded-md mt-4 ${syncMessageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {syncMessage}
                    </div>
                )}
            </div>

            {/* Card 2: Key Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-600">Total Posts</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPosts || 0}</p>
                    </div>
                    <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-600">Total Reach (Impressions)</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{(stats.totalReach || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-600">Avg. Engagement Rate</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{parseFloat(stats.engagementRate || 0).toFixed(2)}%</p>
                    </div>
                </div>
            </div>

            {/* --- Charts --- */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Daily Reach (Last 30 Days)</h4>
                <div className="h-80"><Ga4LineChart data={reachChartData} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4">Posts by Platform</h4>
                    <div className="h-80">
                         <PlatformPostsChart chartData={postsByPlatformData} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4">Engagement Rate by Platform</h4>
                    <div className="h-80 flex justify-center"><EngagementByPlatformChart data={engagementByPlatformData} /></div>
                </div>
            </div>

            <RecentPostsCard />

        </div>
    );
};

const CustomEvent = ({ event }) => (
    // ... (Existing CustomEvent Code) ...
     <div className="flex flex-col text-xs">
        <strong className="font-semibold">{moment(event.start).format('h:mm a')}</strong>
        <span className="truncate">{event.title}</span>
    </div>
);

const ScheduleTabContent = ({ scheduledPosts, setScheduledPosts, calendarDate, setCalendarDate, view, setView, optimalTimes }) => {
    // ... (Existing ScheduleTabContent Code) ...
      console.log('Optimal times received by calendar:', optimalTimes);

    const onEventDrop = useCallback(async ({ event, start }) => {
        if (moment(start).isBefore(moment())) {
            alert("Cannot move events to a past date.");
            return;
        }

        // Check if the event is being dropped on an optimal day

        const originalEvents = [...scheduledPosts];
        const updatedEvents = scheduledPosts.map(e =>
            e.id === event.id ? { ...e, start, end: moment(start).add(1, 'hour').toDate() } : e
        );
        setScheduledPosts(updatedEvents);

        try {
            const res = await fetch(`/api/social/schedule/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduled_at: start.toISOString() }),
            });
            if (!res.ok) throw new Error('Failed to update on server');
        } catch (error) {
            console.error("Failed to update schedule:", error);
            alert('Failed to update schedule. Reverting changes.');
            setScheduledPosts(originalEvents);
        }

    }, [scheduledPosts, setScheduledPosts]);

    const eventPropGetter = useCallback((event) => ({
        style: {
            backgroundColor: PLATFORMS[event.resource?.platform]?.color || '#9CA3AF', // Use color from PLATFORMS
            borderRadius: '5px',
            border: 'none',
            color: 'white'
        }
    }), []); // Added PLATFORMS as dependency if needed, but likely fine


    const dayPropGetter = useCallback((date) => {
           // Get the day of the week as a number (0=Sun, 1=Mon, etc.)
       const dayOfWeekNumber = moment(date).day(); // This gets the day as a number (0-6)
       const isOptimal = optimalTimes.some(time => time.optimal_day === dayOfWeekNumber);

        if (moment(date).isBefore(moment(), 'day')) {
            return {
                className: 'rbc-off-range-bg-disabled',
                style: {
                    backgroundColor: '#f3f4f6',
                    cursor: 'not-allowed',
                },
            }
        }
        if (isOptimal) {
            return {
                style: {
                    backgroundColor: '#ecfdf5', // A light green color
                },
            };
        }

        return {};
    }, [optimalTimes]); // Add optimalTimes as a dependency


    const handleNavigate = (newDate) => setCalendarDate(newDate);

    const handleView = (newView) => {
        setView(newView);
        // Optional: Reset date when switching views if desired
        // if (newView === 'day') {
        //     setCalendarDate(moment().add(1, 'day').toDate());
        // }
    };

    return (
 <>
        <div className="bg-white p-6 rounded-lg shadow-md mb-4 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Schedule Posts</h3>
            <p className="mt-1 text-sm text-gray-500">
                Plan and organize your social media content calendar. Drag and drop posts to easily reschedule them.
            </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 mb-6" role="alert">
            <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3" />
                <p className="text-sm">You can drag and drop your scheduled posts to a new time or date. For more information, see our FAQs.</p>
            </div>
        </div>
                    <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-800 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <StarIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm">
                            We have highlighted the best days to post for your target audience in green.
                        </p>
                    </div>
                </div>
            </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200" style={{ height: '80vh' }}>
            <DragAndDropCalendar
                localizer={localizer}
                events={scheduledPosts}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventPropGetter}
                dayPropGetter={dayPropGetter}
                onEventDrop={onEventDrop}
                views={['month', 'week', 'day', 'agenda']}
                date={calendarDate}
                view={view}
                onNavigate={handleNavigate}
                onView={handleView}
                resizable
                components={{ event: CustomEvent }}

            />
        </div>
        </>
    );
};

const DemographicsTabContent = () => {
    // ... (Existing Demographics Code) ...
      const [ageRange, setAgeRange] = useState('');
    const [sex, setSex] = useState('');
    const [country, setCountry] = useState('');
    const [currentDemographics, setCurrentDemographics] = useState(null);

    useEffect(() => {
        const fetchDemographics = async () => {
            try {
                const res = await fetch('/api/social/demographics');
                if (!res.ok) throw new Error('Failed to fetch demographics.');
                const data = await res.json();
                setCurrentDemographics(data);
                setAgeRange(data.age_range || '');
                setSex(data.sex || '');
                setCountry(data.country || '');
            } catch (error) { console.error('Error fetching demographics:', error); }
        };
        fetchDemographics();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch('/api/social/demographics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ageRange, sex, country }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            alert('Demographic preferences saved successfully!');
            setCurrentDemographics({ age_range: ageRange, sex, country }); // Update current demographics after successful save
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Failed to save demographic preferences.');
        });
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Demographics Insights</h3>
                <p className="text-gray-600 mb-6">
                    Select demographic filters to gain insights into your audience. This feature allows you to tailor your content and campaigns more effectively.
                </p>
            </div>

            {currentDemographics && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Current Demographic Settings</h3> {/* Changed from h4 to h3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Added grid layout */}
                        {/* Age Range Card */}
                        <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 flex items-center">
                            <CakeIcon className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-blue-600">Age Range</p>
                                <p className="text-xl font-bold text-gray-900">{currentDemographics.age_range || 'Not set'}</p>
                            </div>
                        </div>
                        {/* Sex Card */}
                        <div className="bg-green-50 p-5 rounded-lg border border-green-200 flex items-center">
                            <UserIcon className="h-8 w-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-green-600">Sex</p>
                                <p className="text-xl font-bold text-gray-900">{currentDemographics.sex || 'Not set'}</p>
                            </div>
                        </div>
                        {/* Country Card */}
                        <div className="bg-purple-50 p-5 rounded-lg border border-purple-200 flex items-center">
                            <GlobeAltIcon className="h-8 w-8 text-purple-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-purple-600">Country</p>
                                <p className="text-xl font-bold text-gray-900">{currentDemographics.country || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Apply New Filters</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Age Range Card (Largest) */}
                        <div className="md:col-span-2 bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700">Age Range: {ageRange || 'Not set'}</label>
                            <input
                                type="range"
                                id="ageRange"
                                name="ageRange"
                                min="13"
                                max="65"
                                step="1"
                                value={ageRange.split('-')[0] || 13} // Use the start of the range for the slider value
                                onChange={(e) => {
                                    const startAge = parseInt(e.target.value, 10);
                                    let endAge;
                                    if (startAge >= 65) {
                                        endAge = '65+';
                                    } else if (startAge >= 55) {
                                        endAge = '64';
                                    } else if (startAge >= 45) {
                                        endAge = '54';
                                    } else if (startAge >= 35) {
                                        endAge = '44';
                                    } else if (startAge >= 25) {
                                        endAge = '34';
                                    } else if (startAge >= 18) {
                                        endAge = '24';
                                    } else {
                                        endAge = '17';
                                    }
                                    setAgeRange(`${startAge}-${endAge}`);
                                }}
                                className="mt-1 block w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1"><span>13</span><span>18</span><span>25</span><span>35</span><span>45</span><span>55</span><span>65+</span></div>
                        </div>

                        {/* Sex Card */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Sex</label>
                            <div className="mt-1 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="sex-male"
                                        name="sex"
                                        type="checkbox"
                                        value="male"
                                        checked={sex === 'male'}
                                        onChange={() => setSex('male')}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="sex-male" className="ml-2 block text-sm text-gray-900">
                                        Male
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="sex-female"
                                        name="sex"
                                        type="checkbox"
                                        value="female"
                                        checked={sex === 'female'}
                                        onChange={() => setSex('female')}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="sex-female" className="ml-2 block text-sm text-gray-900">
                                        Female
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="sex-other"
                                        name="sex"
                                        type="checkbox"
                                        value="other"
                                        checked={sex === 'other'}
                                        onChange={() => setSex('other')}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="sex-other" className="ml-2 block text-sm text-gray-900">
                                        Other
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Country Card */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                            <input
                                type="text"
                                id="country"
                                name="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="e.g., United States"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            {/* Simplified Country Select */}
                            {/* <select
                                id="country-select" // Different ID needed if input is also present
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                 <option value="">Select a country</option>
                                 <option value="United States">United States</option>
                                 Add other common countries
                            </select> */}

                        </div>
                    </div>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Apply Filters
                    </button>
                </form>
            </div>
        </div>
    );
};

const ScheduleTabWithNoSSR = dynamic(
    () => Promise.resolve(ScheduleTabContent),
    { ssr: false }
);

export default function SocialMediaManagerPage() {

     const { status } = useSession();
    const [activeTab, setActiveTab] = useState('Composer');
    const [scheduledPosts, setScheduledPosts] = useState([]);
    const [optimalTimes, setOptimalTimes] = useState([]);


    // --- LIFTED STATE ---
    const [postContent, setPostContent] = useState('');
    // REMOVED: const [postImages, setPostImages] = useState([]); // Removed
    const [selectedPlatform, setSelectedPlatform] = useState('x');

    const [userImages] = useState([]); // Keep if used by ImageManager directly
    const [isLoadingImages, setIsLoadingImages] = useState(true); // Keep if used by ImageManager
    const [activeDragId, setActiveDragId] = useState(null); // Keep if used by ImageManager

    // --- Calendar State ---
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH);

    const [instagramAccounts, setInstagramAccounts] = useState([]);
    const [pinterestBoards, setPinterestBoards] = useState([]);
    const [loading, setLoading] = useState(true);


    const fetchScheduledPosts = useCallback(async () => {
        try {
            const res = await fetch('/api/social/schedule');
             if (!res.ok) {
                 throw new Error(`Failed to fetch scheduled posts: ${res.status}`);
             }
            const data = await res.json();
            const formattedEvents = data.map(post => ({
                id: post.id,
                // Ensure post.content exists before substring
                title: `${PLATFORMS[post.platform]?.name || 'Post'}: ${post.content ? post.content.substring(0, 30) + '...' : '(No Content)'}`,
                start: new Date(post.scheduled_at),
                end: moment(post.scheduled_at).add(30, 'minutes').toDate(), // Or adjust duration
                resource: { platform: post.platform },
            }));
            setScheduledPosts(formattedEvents);
        } catch (error) { console.error("Failed to fetch posts:", error); }
    }, []);

    const fetchOptimalTimes = useCallback(async () => {
        try {
            const res = await fetch('/api/social/optimal-times');
            if (res.ok) {
                const data = await res.json();
                setOptimalTimes(data || []); // Ensure it's an array
            } else {
                 console.error("Failed to fetch optimal times:", res.status);
            }
        } catch (error) {
            console.error("Failed to fetch optimal times:", error);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [igRes, pinRes] = await Promise.all([
                    fetch('/api/social/instagram/accounts'),
                    fetch('/api/social/pinterest/boards')
                ]);

                if (igRes.ok) {
                    const igAccountsData = await igRes.json(); // Assign value FIRST
                    console.log("Fetched Instagram Accounts:", igAccountsData); // THEN log it
                    setInstagramAccounts(igAccountsData || []); // Ensure array
                } else {
                    console.error("Failed to fetch Instagram accounts:", igRes.status, await igRes.text());
                     setInstagramAccounts([]); // Set empty array on failure
                }

                if (pinRes.ok) {
                    const pinBoardsData = await pinRes.json();
                    setPinterestBoards(pinBoardsData || []); // Ensure array
                } else {
                     console.error("Failed to fetch Pinterest boards:", pinRes.status, await pinRes.text());
                     setPinterestBoards([]); // Set empty array on failure
                }
            } catch (error) {
                console.error("Failed to fetch social data:", error);
                 // Set empty arrays on catch
                 setInstagramAccounts([]);
                 setPinterestBoards([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // Empty dependency array means this runs once on mount


    useEffect(() => {
        if (status === 'authenticated') {
            fetchOptimalTimes();
            fetchScheduledPosts(); // Fetch initially and when status changes
        }
    }, [status, fetchScheduledPosts, fetchOptimalTimes]); // Include dependencies

    if (status === 'loading') return <Layout><p>Loading session...</p></Layout>; // Improved loading message

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold">Social Media Manager</h2>
                <p className="mt-1 text-sm text-gray-500">Design, schedule, and analyze your social media content.</p>
            </div>
            <SocialNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'Composer' && (
                <ComposerTabContent
                    onPostScheduled={fetchScheduledPosts} // Pass fetch function to refresh list after schedule
                    scheduledPosts={scheduledPosts} // Pass scheduled posts for the upcoming list
                    postContent={postContent}
                    setPostContent={setPostContent}
                    selectedPlatform={selectedPlatform}
                    setSelectedPlatform={setSelectedPlatform}
                    // postImages REMOVED
                    // setPostImages REMOVED
                    // userImages={userImages} // Keep if ImageManager needs it
                    // isLoadingImages={isLoadingImages} // Keep if ImageManager needs it
                    // setIsLoadingImages={setIsLoadingImages} // Keep if ImageManager needs it
                    // activeDragId={activeDragId} // Keep if ImageManager needs it
                    // setActiveDragId={setActiveDragId} // Keep if ImageManager needs it
                    instagramAccounts={instagramAccounts}
                    pinterestBoards={pinterestBoards}
                    loading={loading} // Pass loading state for dropdowns etc.
                    // Removed fetchScheduledPosts prop as onPostScheduled handles refresh
                />
            )}
            {activeTab === 'Analytics' && <AnalyticsTabContent />}
            {activeTab === 'Schedule' && (
                <ScheduleTabWithNoSSR
                    scheduledPosts={scheduledPosts}
                    setScheduledPosts={setScheduledPosts} // Allow drag-and-drop updates
                    // fetchScheduledPosts={fetchScheduledPosts} // Not strictly needed if list updates elsewhere
                    calendarDate={calendarDate}
                    setCalendarDate={setCalendarDate}
                    view={view}
                    setView={setView}
                    optimalTimes={optimalTimes}
                    // Pass other props if needed by ScheduleTabContent
                />
            )}
            {activeTab === 'Demographics' && <DemographicsTabContent />}
            {activeTab === 'Mailchimp' && <MailchimpTabContent />}
            <CalenderModal id="CalenderModal" />
        </Layout>
    );
}