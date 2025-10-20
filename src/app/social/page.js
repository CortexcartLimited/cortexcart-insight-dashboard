// src/app/social/page.js
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
        name: 'X (twitter)',
        maxLength: 280,
        icon: (props) => ( <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M13.682 10.623 20.239 3h-1.64l-5.705 6.44L7.65 3H3l6.836 9.753L3 21h1.64l6.082-6.885L16.351 21H21l-7.318-10.377zM14.78 13.968l-.87-1.242L6.155 4.16h2.443l4.733 6.742.87 1.242 7.03 9.98h-2.443l-5.045-7.143z" /></svg>),
        placeholder: "What is on your mind? or need help ask AI to help you generate your feelings into more engaging content including relevant tags",
        disabled: false,
        color: '#000000',
        apiEndpoint: '/api/social/post' // <-- FIX: Point to the client-facing route
    },
    facebook: {
        name: 'Facebook',
        maxLength: 5000,
        icon: (props) => (<svg {...props} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.77-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.028C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>),
        placeholder: "What is on your mind? or need help ask AI to help you generate your feelings into more engaging content including relevant tags",
        disabled: false,
        color: '#1877F2',
        apiEndpoint: '/api/social/post' // <-- FIX: Point to the client-facing route
    },
    pinterest: {
        name: 'Pinterest',
        maxLength: 500,
        icon: PinterestIcon,
        placeholder: 'Add a Pin description or Generate with AI including pin tags...',
        disabled: false,
        color: '#E60023',
        apiEndpoint: '/api/social/post', // <-- FIX: Point to the client-facing route
    },
    instagram: {
        name: 'Instagram',
        maxLength: 2200,
        icon: (props) => (<svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c1.74 0 2.28.01 3.07.05 1.07.05 1.81.22 2.42.46a4.88 4.88 0 0 1 1.76 1.15 4.88 4.88 0 0 1 1.15 1.76c.24.6.41 1.35.46 2.42.04.79.05 1.33.05 3.07s-.01 2.28-.05 3.07c-.05 1.07-.22 1.81-.46 2.42a4.88 4.88 0 0 1-1.15 1.76 4.88 4.88 0 0 1-1.76 1.15c-.6.24-1.35.41-2.42.46-.79.04-1.33.05-3.07.05s-2.28-.01-3.07-.05c-1.07-.05-1.81-.22-2.42-.46a4.88 4.88 0 0 1-1.76-1.15 4.88 4.88 0 0 1-1.15-1.76c-.24-.6-.41-1.35-.46-2.42a83.3 83.3 0 0 1-.05-3.07s.01-2.28.05-3.07c.05-1.07.22 1.81.46-2.42a4.88 4.88 0 0 1 1.15-1.76A4.88 4.88 0 0 1 6.5 2.51c.6-.24 1.35-.41 2.42-.46.79-.04 1.33-.05 3.07-.05M12 0C9.26 0 8.74.01 7.9.06 6.63.11 5.6.31 4.7.7a6.88 6.88 0 0 0-2.47 2.47c-.4 1-.6 1.93-.65 3.2-.04.84-.05 1.36-.05 4.1s.01 3.26.05 4.1c.05 1.27.25 2.2.65 3.2a6.88 6.88 0 0 0 2.47 2.47c1 .4 1.93.6 3.2.65.84.04 1.36.05 4.1.05s3.26-.01 4.1-.05c1.27-.05 2.2-.25 3.2-.65a6.88 6.88 0 0 0 2.47-2.47c.4-1 .6-1.93.65-3.2.04-.84.05-1.36-.05-4.1s-.01-3.26-.05-4.1c-.05-1.27-.25-2.2-.65-3.2A6.88 6.88 0 0 0 19.3.7c-1-.4-1.93-.6-3.2-.65-.84-.04-1.36-.05-4.1-.05zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /></svg>),
        placeholder: 'Add a Image description or Generate with AI including tags...',
        disabled: false,
        color: '#E4405F',
        apiEndpoint: '/api/social/post' // <-- FIX: Point to the client-facing route
    },
      youtube: {
        name: 'YouTube',
        maxLength: Infinity,
        icon: YouTubeIcon,
        placeholder: "Enter a video description or generate with AI including video tags...",
        disabled: false,
        color: '#FF0000',
        apiEndpoint: '/api/social/youtube/upload-video' // <-- FIX: Leave this one, as it's a special multipart/form-data upload
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

// --- START: MODIFIED ComposerTabContent ---
const ComposerTabContent = ({ scheduledPosts, onPostScheduled, postContent, setPostContent, selectedPlatform, setSelectedPlatform, instagramAccounts, pinterestBoards, userEmail, loading, ...props }) => {

    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
    const [scheduleTime, setScheduleTime] = useState('10:00');
    const [isPosting, setIsPosting] = useState(false);
    // REMOVED: const [postImages, setPostImages] = useState([]); // REMOVE THIS LATER IF NOT USED
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

    // UseMemo to get the current platform config reliably
    const currentPlatform = useMemo(() => PLATFORMS[selectedPlatform], [selectedPlatform]);

    // Handles both YouTube uploads and standard posts
    const handleSubmit = () => {
        if (selectedPlatform === 'youtube') {
            handleUploadToYouTube();
        } else {
            handlePostNow();
        }
    };

    const handleUploadToYouTube = async () => {
        if (!currentPlatform || !currentPlatform.apiEndpoint) {
             setPostStatus({ message: 'YouTube API endpoint not configured.', type: 'error' });
             return;
        }
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
                console.log("Fetching thumbnail image:", selectedImageUrl);
                const response = await fetch(selectedImageUrl);
                if (!response.ok) throw new Error(`Failed to load thumbnail image. Status: ${response.status}`);
                const blob = await response.blob();
                formData.append('thumbnail', blob, 'thumbnail.jpg'); // Adjust filename as needed
                console.log("Thumbnail added to form data.");
            }

            const result = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                 xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        setUploadProgress(percentComplete);
                        setUploadMessage(`Uploading video file... ${Math.round(percentComplete)}%`);
                    }
                });

                xhr.onload = () => {
                    setUploadMessage('Processing video and setting thumbnail...');
                    console.log("XHR Status:", xhr.status);
                    console.log("XHR Response:", xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                           resolve(JSON.parse(xhr.responseText));
                        } catch (parseError) {
                            console.error("Failed to parse YouTube upload response:", parseError);
                            reject(new Error("Received invalid response from server after upload."));
                        }
                    } else {
                        let errorMsg = `Upload failed with status ${xhr.status}`;
                        try {
                             const errorJson = JSON.parse(xhr.responseText);
                             errorMsg += `: ${errorJson.message || errorJson.error || 'Unknown error'}`;
                        } catch {
                             errorMsg += `: ${xhr.statusText}`;
                        }
                        reject(new Error(errorMsg));
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Upload failed. Please check your network connection.'));
                };

                xhr.open('POST', currentPlatform.apiEndpoint, true); // Use apiEndpoint from PLATFORMS
                // Note: Don't set Content-Type header when sending FormData, browser does it.
                // Include auth headers if your YouTube API requires them
                // xhr.setRequestHeader('Authorization', `Bearer YOUR_AUTH_TOKEN`);
                xhr.send(formData);
                console.log("XHR request sent to:", currentPlatform.apiEndpoint);
            });


            setPostStatus({ message: result.message || 'YouTube video uploaded successfully!', type: 'success' });
            // Clear form
            setVideoFile(null);
            setVideoTitle('');
            setPostContent('');
            setSelectedImageUrl('');

        } catch (err) {
            setPostStatus({ message: err.message, type: 'error' });
            console.error("YouTube upload process failed:", err);
        } finally {
            setIsUploading(false);
            setUploadProgress(0); // Reset progress
             setUploadMessage('');
        }
    };

    // REMOVED: handleImageAdded function - Check if needed, maybe related to postImages state
    // REMOVED: handleRemoveImage function - Check if needed, maybe related to postImages state

    const handleGeneratePost = async () => {
        if (!topic.trim() || !currentPlatform) return; // Check if currentPlatform exists
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
        // Content check, allow Pinterest without content initially
        if (!postContent && selectedPlatform !== 'pinterest') {
             setPostStatus({ message: 'Post content is required.', type: 'error' });
             return;
        }

        setIsPosting(true);
        setPostStatus({ message: '', type: '' });

        // Get apiEndpoint from the current platform config
        let apiEndpoint = currentPlatform?.apiEndpoint;
        let requestBody = {};

        // Platform specific checks and body construction
        if (selectedPlatform === 'pinterest') {
            console.log("Checking Pinterest requirements: Board=", selectedBoardId, "Image=", selectedImageUrl, "Title=", pinTitle);
            if (!selectedBoardId || !selectedImageUrl || !pinTitle) {
                setPostStatus({ message: 'A board, image, and title are required for Pinterest.', type: 'error' });
                setIsPosting(false);
                return;
            }
            requestBody = {
                platform: selectedPlatform, // Include platform
                boardId: selectedBoardId,
                imageUrl: selectedImageUrl,
                title: pinTitle,
                description: postContent, // Description is optional but included
                user_email: userEmail
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
                platform: selectedPlatform, // Correctly added
                instagramUserId: selectedInstagramId,
                imageUrl: selectedImageUrl,
                caption: postContent,
                user_email: userEmail
            };
        } else if (selectedPlatform === 'youtube') {
           // YouTube uses handleSubmit -> handleUploadToYouTube
           console.warn("handlePostNow called for YouTube, should use handleSubmit via Upload button.");
           setPostStatus({ message: 'Please use the Upload Now button for YouTube.', type: 'info'});
           setIsPosting(false);
           return;
        } else if (currentPlatform) { // For other platforms like X, Facebook
            requestBody = {
                platform: selectedPlatform, // Include platform for generic endpoints if needed
                content: postContent,
                imageUrl: selectedImageUrl || null, // Use selectedImageUrl (can be null/empty)
                user_email: userEmail
            };
        } else {
             console.error("No valid platform selected or configured.");
             setPostStatus({ message: `Cannot post: Platform "${selectedPlatform}" is not recognized or configured.`, type: 'error'});
             setIsPosting(false);
             return;
        }

        // Check if userEmail was passed
        if (!userEmail) {
            setPostStatus({ message: 'User session not found. Please refresh and try again.', type: 'error' });
            setIsPosting(false);
            return;
        }

        // Check if apiEndpoint is defined for the selected platform before proceeding
        if (!apiEndpoint) {
            console.error("API endpoint is not defined for platform:", selectedPlatform);
            setPostStatus({ message: `Cannot post: API endpoint not configured for ${currentPlatform?.name || selectedPlatform}.`, type: 'error'});
            setIsPosting(false);
            return;
        }

        console.log(`Sending POST request to ${apiEndpoint} with body:`, JSON.stringify(requestBody));

        try {
            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const result = await res.json();
            // Check based on status code first, then look for error/message in body
            if (!res.ok) {
                 console.error(`API Error (${res.status}) from ${apiEndpoint}:`, result);
                 // Try to get a meaningful message
                 let errorMsg = result.details || result.error || result.message || `Request failed with status ${res.status}`;
                 throw new Error(errorMsg);
            }

            setPostStatus({ message: `Post published to ${currentPlatform.name} successfully!`, type: 'success' });
            setPostContent('');
            setSelectedImageUrl(''); // Clear the selected image URL
            // Clear platform specific fields if needed
            if (selectedPlatform === 'pinterest') setPinTitle('');

        } catch (err) {
            setPostStatus({ message: err.message, type: 'error' });
            console.error(`Error posting to ${selectedPlatform} at ${apiEndpoint}:`, err);
        } finally {
            setIsPosting(false);
        }
    };
    // --- END MODIFIED handlePostNow ---


    const handleSchedulePost = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous schedule errors

        try {
            const scheduledAt = moment(`${scheduleDate} ${scheduleTime}`).toISOString();

            if (moment(scheduledAt).isBefore(moment())) {
                throw new Error('You cannot schedule a post in the past.');
            }

            // --- Robust validation before scheduling ---
             if (!currentPlatform) {
                 throw new Error(`Platform "${selectedPlatform}" is not recognized.`);
             }
             if (!postContent && selectedPlatform !== 'pinterest') {
                  throw new Error('Post content is required to schedule.');
             }
             // Updated validation for FB/IG/Pinterest requiring image
             if ((selectedPlatform === 'instagram' || selectedPlatform === 'pinterest' || selectedPlatform === 'facebook') && !selectedImageUrl) {
                 throw new Error(`An image is required to schedule for ${currentPlatform.name}.`);
             }
              if (selectedPlatform === 'pinterest' && (!selectedBoardId || !pinTitle)) {
                  throw new Error('A board and title are required to schedule a Pin.');
             }
              if (selectedPlatform === 'instagram' && !selectedInstagramId) {
                  throw new Error('An Instagram account must be selected to schedule.');
             }
             if (isOverLimit) {
                 throw new Error(`Content exceeds the maximum length of ${currentPlatform.maxLength} for ${currentPlatform.name}.`);
             }
             // Add YouTube specific validation if scheduling is supported
             // if (selectedPlatform === 'youtube' && (!videoFile || !videoTitle)) { etc... }
            // --- End validation ---


            const schedulePayload = {
                platform: selectedPlatform,
                content: postContent,
                imageUrl: selectedImageUrl || null,
                scheduledAt: scheduledAt,
                hashtags: [], // Maintained from previous fix
                // Include platform-specific fields for the backend to save
                boardId: selectedPlatform === 'pinterest' ? selectedBoardId : undefined, // Send only if pinterest
                pinTitle: selectedPlatform === 'pinterest' ? pinTitle : undefined,     // Send only if pinterest
                instagramUserId: selectedPlatform === 'instagram' ? selectedInstagramId : undefined, // Send only if instagram
                // Add fields for YouTube if schedule API supports it
                // videoUrl: selectedPlatform === 'youtube' ? 'some_identifier_or_url' : undefined,
                // videoTitle: selectedPlatform === 'youtube' ? videoTitle : undefined,
                // privacyStatus: selectedPlatform === 'youtube' ? privacyStatus : undefined,
            };

             console.log("Sending schedule request with payload:", JSON.stringify(schedulePayload));

            const response = await fetch('/api/social/schedule/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schedulePayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                 console.error("Schedule API Error:", errorData);
                throw new Error(errorData.message || 'Failed to schedule the post.');
            }

             console.log("Post scheduled successfully!");
            onPostScheduled(); // Trigger refresh/callback

             // Clear form after successful schedule
             setPostContent('');
             setSelectedImageUrl('');
             setPinTitle('');
             // Optionally reset date/time or leave them for next post
             setScheduleDate(moment().add(1, 'day').format('YYYY-MM-DD'));
             setScheduleTime('10:00');
             setError(''); // Clear error message on success


        } catch (err) {
            console.error("Error scheduling post:", err);
            setError(err.message); // Set error state to display in the form
        }
    };

    // Use currentPlatform safely for maxLength check
    const isOverLimit = currentPlatform && postContent.length > currentPlatform.maxLength;

    return (
        <>
            <UploadProgressModal
                isOpen={isUploading}
                progress={uploadProgress}
                message={uploadMessage}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Composer) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    {/* Platform Tabs */}
                    <div className="flex items-center border-b pb-4 overflow-x-auto whitespace-nowrap">
                        {Object.values(PLATFORMS).map(platform => {
                            const Icon = platform.icon;
                            // Generate a stable key for the platform button
                            const platformKey = platform.name.toLowerCase().split(' ')[0].replace('(twitter)', '');
                            return (
                                <button
                                    key={platformKey}
                                    // Use the platform key for setting state and checking active
                                    onClick={() => setSelectedPlatform(platformKey)}
                                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md mr-2 ${selectedPlatform === platformKey ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    disabled={platform.disabled}
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
                              <div>
                                 <label className="block text-sm font-medium text-gray-700">Video Thumbnail (Optional)</label>
                                 <p className="text-xs text-gray-500">Select an image below using the Image Manager.</p>
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
                                        <option disabled>No boards found</option>
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
                                        <option disabled>No accounts connected.</option>
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
                             </div>
                         </div>
                    )}

                    {/* Image Preview Area */}
                    {selectedImageUrl && (
                        <div className="mt-4 mb-4 relative group">
                            <p className="text-xs text-gray-500 mb-1">Attached Image:</p>
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                <Image src={selectedImageUrl} alt="Selected image preview" layout="fill" objectFit="cover" />
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedImageUrl('')}
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
                        maxLength={currentPlatform?.maxLength < Infinity ? currentPlatform?.maxLength : undefined} // Apply maxLength unless Infinity
                    />

                    {/* Character Count and Post Buttons */}
                    <div className="mt-4 flex justify-between items-center">
                        <span className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                           {currentPlatform?.maxLength ? `${postContent.length}/${currentPlatform.maxLength < Infinity ? currentPlatform.maxLength : '∞'}` : ''}
                        </span>
                        <div className="flex items-center gap-x-2">
                             {/* Copy button can be added here if needed */}
                            <button
                                onClick={handleSubmit}
                                disabled={
                                    isPosting || isUploading ||
                                    (selectedPlatform !== 'pinterest' && !postContent.trim()) || // Check trimmed content
                                    isOverLimit ||
                                    (selectedPlatform === 'facebook' && !selectedImageUrl) || // Added FB image check
                                    (selectedPlatform === 'instagram' && (!selectedImageUrl || !selectedInstagramId)) ||
                                    (selectedPlatform === 'pinterest' && (!selectedImageUrl || !selectedBoardId || !pinTitle.trim())) || // Check trimmed title
                                    (selectedPlatform === 'youtube' && (!videoFile || !videoTitle.trim())) // Check trimmed title
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

                    {/* Schedule Form - Only show if not YouTube (or if YouTube scheduling is added later) */}
                    {selectedPlatform !== 'youtube' && (
                        <form onSubmit={handleSchedulePost} className="mt-6 border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Schedule Post</h4>
                            {error && <p className="text-sm text-red-600 mb-2">{error}</p>} {/* Show schedule error */}
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
                                    disabled={
                                        isPosting || isUploading || // Disable if posting/uploading
                                        (selectedPlatform !== 'pinterest' && !postContent.trim()) ||
                                        isOverLimit || !scheduleDate || !scheduleTime ||
                                        (selectedPlatform === 'facebook' && !selectedImageUrl) || // Added FB image check
                                        (selectedPlatform === 'instagram' && (!selectedImageUrl || !selectedInstagramId)) ||
                                        (selectedPlatform === 'pinterest' && (!selectedImageUrl || !selectedBoardId || !pinTitle.trim()))
                                    }
                                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    <CalendarIcon className="h-5 w-5 mr-2" />Schedule Post
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* AI Assistant */}
                    {currentPlatform && ( // Only show AI if a platform is selected
                        <div className="bg-white p-6 rounded-lg shadow-md space-y-4 border border-gray-200">
                            <h3 className="font-semibold text-lg">AI Assistant</h3>
                            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'New Summer T-Shirt Sale'" className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"/>
                            <button onClick={handleGeneratePost} disabled={isGenerating || !topic.trim()} className="w-full flex items-center justify-center px-4 py-2 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                {isGenerating ? 'Generating...' : `Generate for ${currentPlatform.name}`}
                            </button>
                             {/* Display AI generation error if needed */}
                        </div>
                    )}

                    {/* Upcoming Posts */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Upcoming Posts</h3>
                             {/* Link to full schedule view? */}
                             <Link href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Schedule'); }} className="text-sm text-blue-600 hover:underline">
                                View Calendar
                            </Link>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                           {scheduledPosts.length > 0 ? scheduledPosts.slice(0, 5).map(post => {
                                const postPlatformKey = post.resource?.platform;
                                const platformConfig = PLATFORMS[postPlatformKey];
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
                                        <p className="text-sm text-gray-600 truncate mt-1">{post.title && typeof post.title === 'string' ? post.title.split(': ')[1] || post.title : '(No Content/Title)'}</p>
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
                        // Add required props like user_email or userId if needed by ImageManager API calls
                    />
                </div>
            </div>
        </>
    );
};
// --- END: MODIFIED ComposerTabContent ---


const AnalyticsTabContent = () => {
    // ... (Existing Analytics Code - Should be OK) ...
     const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSyncing, setIsSyncing] = useState({ x: false, facebook: false, pinterest: false, youtube: false});
    const [syncMessage, setSyncMessage] = useState('');
    const [syncMessageType, setSyncMessageType] = useState('info');
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
            fetchAnalytics(); // Refresh analytics after sync
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
            data: platformStats.map(item => item.postCount || 0), // Default to 0 if null
             backgroundColor: backgroundColors,
            borderWidth: 1,
        }]
    };

    const engagementByPlatformData = {
        labels: platformLabels.map(label => PLATFORMS[label]?.name || label), // Use platform name for labels
        datasets: [{
            label: 'Engagement Rate',
            data: (platformStats || []).map(p => p.engagementRate || 0), // Default to 0
              backgroundColor: backgroundColors,
        }],
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Analytics Overview</h3>
                 <div className="flex flex-wrap gap-2">
                     {/* Dynamically create sync buttons based on PLATFORMS might be better */}
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

             {/* Key Metrics */}
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

            {/* Charts */}
             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                 <h4 className="text-xl font-semibold text-gray-800 mb-4">Daily Reach (Last 30 Days)</h4>
                 <div className="h-80"><Ga4LineChart data={reachChartData} /></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200"> {/* Added border */}
                     <h4 className="text-xl font-semibold text-gray-800 mb-4">Posts by Platform</h4>
                     <div className="h-80 flex justify-center"> {/* Centering might affect bar chart */}
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
    // ... (Existing CustomEvent Code - Should be OK) ...
      <div className="flex flex-col text-xs p-1"> {/* Added padding */}
        <strong className="font-semibold">{moment(event.start).format('h:mm a')}</strong>
        <span className="truncate whitespace-normal text-wrap">{event.title}</span> {/* Allow wrapping */}
    </div>
);


const ScheduleTabContent = ({ scheduledPosts, setScheduledPosts, calendarDate, setCalendarDate, view, setView, optimalTimes }) => {
    // ... (Existing ScheduleTabContent Code - Should be OK) ...
      console.log('Optimal times received by calendar:', optimalTimes);

    const onEventDrop = useCallback(async ({ event, start, end }) => { // Added end
        if (moment(start).isBefore(moment())) {
            alert("Cannot move events to a past date/time.");
            return;
        }

        const originalEvents = [...scheduledPosts];
        // Update end time based on new start time, maintaining duration if possible
        const duration = moment(event.end).diff(moment(event.start));
        const newEnd = moment(start).add(duration).toDate();

        const updatedEvents = scheduledPosts.map(e =>
            e.id === event.id ? { ...e, start, end: newEnd } : e // Use newEnd
        );
        setScheduledPosts(updatedEvents); // Optimistic update

        try {
            console.log(`Updating event ${event.id} to start at ${start.toISOString()}`);
            const res = await fetch(`/api/social/schedule/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduled_at: start.toISOString() }), // Send new start time
            });
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.message || `Failed to update schedule: ${res.status}`);
            }
             console.log(`Event ${event.id} updated successfully.`);
        } catch (error) {
            console.error("Failed to update schedule:", error);
            alert(`Failed to update schedule: ${error.message}. Reverting changes.`);
            setScheduledPosts(originalEvents); // Revert on error
        }

    }, [scheduledPosts, setScheduledPosts]);

    const eventPropGetter = useCallback((event) => {
         const platformConfig = PLATFORMS[event.resource?.platform];
         return {
             style: {
                 backgroundColor: platformConfig?.color || '#9CA3AF',
                 borderRadius: '5px',
                 border: 'none',
                 color: 'white',
                 opacity: 0.8, // Slight transparency
                 fontSize: '0.75rem', // Smaller font
             }
         };
    }, []);


    const dayPropGetter = useCallback((date) => {
       const dayOfWeekNumber = moment(date).day();
       const isOptimal = optimalTimes.some(time => time.optimal_day === dayOfWeekNumber);

        if (moment(date).isBefore(moment(), 'day')) {
            return {
                className: 'rbc-off-range-bg-disabled', // Use existing class or create custom
                style: { backgroundColor: '#f3f4f6', cursor: 'not-allowed' },
            }
        }
        if (isOptimal) {
            return { style: { backgroundColor: '#d1fae5' } }; // Slightly darker green
        }
        return {};
    }, [optimalTimes]);


    const handleNavigate = (newDate) => setCalendarDate(newDate);

    const handleView = (newView) => setView(newView);


    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md mb-4 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Schedule Posts</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Plan and organize your social media content calendar. Drag and drop posts to easily reschedule them. Highlighted days indicate optimal posting times based on your settings.
                </p>
            </div>

            <div className="flex justify-between items-center mb-4 flex-wrap gap-2"> {/* Added flex layout */}
                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-3 rounded-r-lg" role="alert"> {/* Reduced padding */}
                    <div className="flex items-center">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                        <p className="text-sm">Drag & drop posts to reschedule.</p>
                    </div>
                </div>
                 <div className="bg-green-50 border-l-4 border-green-400 text-green-800 p-3 rounded-r-lg"> {/* Reduced padding */}
                    <div className="flex items-center">
                        <StarIcon className="h-5 w-5 text-green-500 mr-2" aria-hidden="true" />
                        <p className="text-sm">Green days are optimal posting times.</p>
                    </div>
                </div>
             </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200" style={{ height: '75vh' }}> {/* Adjusted padding and height */}
                <DragAndDropCalendar
                    localizer={localizer}
                    events={scheduledPosts}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventPropGetter}
                    dayPropGetter={dayPropGetter}
                    onEventDrop={onEventDrop}
                    onEventResize={undefined} // Disable resize if not needed/implemented
                    resizable={false} // Disable resize
                    selectable // Allow selecting time slots (optional)
                    // onSelectSlot={handleSelectSlot} // Handler for selecting slots
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView={Views.MONTH} // Set default view
                    date={calendarDate}
                    view={view}
                    onNavigate={handleNavigate}
                    onView={handleView}
                    components={{ event: CustomEvent }}
                    min={moment().startOf('day').toDate()} // Prevent navigating to past days in day/week view (optional)
                />
            </div>
        </>
    );
};


const DemographicsTabContent = () => {
    // ... (Existing Demographics Code - Should be OK) ...
     const [ageRange, setAgeRange] = useState('');
    const [sex, setSex] = useState('');
    const [country, setCountry] = useState('');
    const [currentDemographics, setCurrentDemographics] = useState(null);
    const [saveStatus, setSaveStatus] = useState({ message: '', type: '' }); // For save feedback

    useEffect(() => {
        const fetchDemographics = async () => {
             setSaveStatus({ message: '', type: '' }); // Clear status on load
            try {
                const res = await fetch('/api/social/demographics');
                if (!res.ok) throw new Error('Failed to fetch demographics.');
                const data = await res.json();
                setCurrentDemographics(data);
                // Set initial form state from fetched data
                setAgeRange(data.age_range || '');
                setSex(data.sex || '');
                setCountry(data.country || '');
            } catch (error) {
                 console.error('Error fetching demographics:', error);
                 setSaveStatus({ message: 'Could not load current settings.', type: 'error'});
            }
        };
        fetchDemographics();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveStatus({ message: 'Saving...', type: 'info' }); // Indicate saving
        try {
            const response = await fetch('/api/social/demographics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ageRange, sex, country }),
            });
             const data = await response.json();
            if (!response.ok) {
                 throw new Error(data.message || 'Failed to save preferences.');
            }
            console.log('Success:', data);
            setSaveStatus({ message: 'Preferences saved successfully!', type: 'success' });
            // Update current demographics display immediately
            setCurrentDemographics({ age_range: ageRange, sex, country });
        } catch (error) {
            console.error('Error saving demographics:', error);
            setSaveStatus({ message: error.message, type: 'error' });
        }
    };


    // Function to format age range display
     const formatAgeRangeDisplay = (range) => {
         if (!range) return 'Not set';
         if (range.endsWith('+')) return range; // Handle '65+'
         const parts = range.split('-');
         if (parts.length === 2 && parts[1] === parts[0]) return parts[0]; // If range is single year e.g., "18-18"
         return range;
     };

     // Function to update age range state based on slider value
     const handleAgeSliderChange = (e) => {
         const startAge = parseInt(e.target.value, 10);
         let displayRange;
         // Define age buckets matching slider ticks/labels if possible
         if (startAge >= 65) displayRange = '65+';
         else if (startAge >= 55) displayRange = '55-64';
         else if (startAge >= 45) displayRange = '45-54';
         else if (startAge >= 35) displayRange = '35-44';
         else if (startAge >= 25) displayRange = '25-34';
         else if (startAge >= 18) displayRange = '18-24';
         else displayRange = '13-17';
         setAgeRange(displayRange); // Update state with the bucket string
     };


    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Audience Demographics</h3>
                <p className="text-gray-600 mb-6">
                    Set your target audience demographics. This information helps tailor AI suggestions and identify optimal posting times.
                </p>
            </div>

            {/* Display Current Settings */}
            {currentDemographics && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Current Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 flex items-center">
                            <CakeIcon className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-blue-600">Age Range</p>
                                <p className="text-xl font-bold text-gray-900">{formatAgeRangeDisplay(currentDemographics.age_range)}</p>
                            </div>
                        </div>
                        <div className="bg-green-50 p-5 rounded-lg border border-green-200 flex items-center">
                            <UserIcon className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-600">Sex</p>
                                <p className="text-xl font-bold text-gray-900 capitalize">{currentDemographics.sex || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="bg-purple-50 p-5 rounded-lg border border-purple-200 flex items-center">
                            <GlobeAltIcon className="h-8 w-8 text-purple-600 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-purple-600">Country</p>
                                <p className="text-xl font-bold text-gray-900">{currentDemographics.country || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form to Update Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Update Target Audience</h3>
                 {/* Display Save Status */}
                {saveStatus.message && (
                    <div className={`mb-4 text-sm p-3 rounded-md text-center ${
                        saveStatus.type === 'success' ? 'bg-green-100 text-green-800' :
                        saveStatus.type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800' // Info
                    }`}>
                        {saveStatus.message}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                     {/* Age Range Slider */}
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <label htmlFor="ageRangeSlider" className="block text-sm font-medium text-gray-700">Target Age Range: {formatAgeRangeDisplay(ageRange)}</label>
                         <input
                            type="range"
                            id="ageRangeSlider" // Changed ID
                            name="ageRangeSlider"
                            min="13" // Corresponds to '13-17'
                            max="65" // Corresponds to '65+'
                            step="1" // Fine-grained steps, logic maps to buckets
                             // Determine slider value based on the start of the ageRange string
                             value={ageRange ? (ageRange === '65+' ? 65 : parseInt(ageRange.split('-')[0], 10)) : 13}
                            onChange={handleAgeSliderChange} // Use the new handler
                            className="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                         <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                             <span>13</span><span>18</span><span>25</span><span>35</span><span>45</span><span>55</span><span>65+</span>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sex Selection */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700">Target Sex</label>
                            <div className="mt-2 space-y-2">
                                {['any', 'male', 'female', 'other'].map((option) => ( // Added 'any'
                                    <div key={option} className="flex items-center">
                                        <input
                                            id={`sex-${option}`}
                                            name="sex"
                                            type="radio" // Use radio buttons for single selection
                                            value={option}
                                            checked={sex === option}
                                            onChange={() => setSex(option)}
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                        />
                                        <label htmlFor={`sex-${option}`} className="ml-2 block text-sm text-gray-900 capitalize">
                                            {option === 'any' ? 'Any' : option}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Country Selection */}
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Target Country</label>
                            {/* Consider using a searchable dropdown component for better UX */}
                            <input
                                type="text"
                                id="country"
                                name="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="e.g., United States (or leave blank for Any)"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                             {/* Basic datalist example for suggestions */}
                             {/* <datalist id="country-suggestions">
                                 <option value="United States"/>
                                 <option value="United Kingdom"/>
                                 <option value="Canada"/>
                                 Add more common countries
                             </datalist>
                             <input list="country-suggestions" ... /> */}
                        </div>
                    </div>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save Preferences
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

// --- START: MODIFIED SocialMediaManagerPage ---
export default function SocialMediaManagerPage() {

    const { data: session, status } = useSession(); // Get session data too
    const [activeTab, setActiveTab] = useState('Composer');
    const [scheduledPosts, setScheduledPosts] = useState([]);
    const [optimalTimes, setOptimalTimes] = useState([]);

    // Composer state needs to be managed here if ComposerTabContent is conditionally rendered
    // or passed down if Layout handles tabs differently. Assuming it's passed down:
    const [postContent, setPostContent] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('x'); // Default platform

    // State for data fetching
    const [instagramAccounts, setInstagramAccounts] = useState([]);
    const [pinterestBoards, setPinterestBoards] = useState([]);
    const [loadingSocialData, setLoadingSocialData] = useState(true); // Renamed for clarity

    // Calendar State
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [view, setView] = useState(Views.MONTH);

    // Fetch scheduled posts
    const fetchScheduledPosts = useCallback(async () => {
        if (status !== 'authenticated') return; // Don't fetch if not logged in
        try {
            const res = await fetch('/api/social/schedule');
             if (!res.ok) {
                 console.error(`Failed to fetch scheduled posts: ${res.status}`);
                 setScheduledPosts([]); // Clear posts on error
                 return; // Exit if fetch failed
             }
            const data = await res.json();
             // Ensure data is an array before mapping
            const posts = Array.isArray(data) ? data : [];
            const formattedEvents = posts.map(post => ({
                id: post.id,
                title: `${PLATFORMS[post.platform]?.name || post.platform || 'Post'}: ${post.content ? post.content.substring(0, 30) + '...' : '(No Content)'}`,
                start: new Date(post.scheduled_at),
                end: moment(post.scheduled_at).add(30, 'minutes').toDate(),
                resource: { platform: post.platform },
            }));
            setScheduledPosts(formattedEvents);
        } catch (error) {
             console.error("Error processing scheduled posts:", error);
             setScheduledPosts([]); // Clear posts on error
        }
    }, [status]); // Add status dependency

    // Fetch optimal times
    const fetchOptimalTimes = useCallback(async () => {
         if (status !== 'authenticated') return;
        try {
            const res = await fetch('/api/social/optimal-times');
            if (res.ok) {
                const data = await res.json();
                setOptimalTimes(Array.isArray(data) ? data : []);
            } else {
                 console.error("Failed to fetch optimal times:", res.status);
                 setOptimalTimes([]);
            }
        } catch (error) {
            console.error("Failed to fetch optimal times:", error);
            setOptimalTimes([]);
        }
    }, [status]); // Add status dependency


    // Fetch Instagram accounts and Pinterest boards
    useEffect(() => {
        const fetchSocialConnectionData = async () => {
             if (status !== 'authenticated') {
                 setLoadingSocialData(false); // Stop loading if not logged in
                 return;
             }
            try {
                setLoadingSocialData(true);
                const [igRes, pinRes] = await Promise.all([
                    fetch('/api/social/instagram/accounts'),
                    fetch('/api/social/pinterest/boards')
                ]);

                if (igRes.ok) {
                    const igAccountsData = await igRes.json();
                    console.log("Fetched Instagram Accounts:", igAccountsData);
                    setInstagramAccounts(Array.isArray(igAccountsData) ? igAccountsData : []);
                } else {
                    console.error("Failed to fetch Instagram accounts:", igRes.status, await igRes.text());
                     setInstagramAccounts([]);
                }

                if (pinRes.ok) {
                    const pinBoardsData = await pinRes.json();
                     console.log("Fetched Pinterest Boards:", pinBoardsData);
                    setPinterestBoards(Array.isArray(pinBoardsData) ? pinBoardsData : []);
                } else {
                     console.error("Failed to fetch Pinterest boards:", pinRes.status, await pinRes.text());
                     setPinterestBoards([]);
                }
            } catch (error) {
                console.error("Failed to fetch social connection data:", error);
                 setInstagramAccounts([]);
                 setPinterestBoards([]);
            } finally {
                setLoadingSocialData(false);
            }
        };

        fetchSocialConnectionData();
    }, [status]); // Fetch when authentication status changes


    // Fetch dynamic data (schedule, optimal times) when authenticated
    useEffect(() => {
        if (status === 'authenticated') {
            fetchOptimalTimes();
            fetchScheduledPosts();
        } else {
            // Clear data if user logs out
             setScheduledPosts([]);
             setOptimalTimes([]);
        }
    }, [status, fetchScheduledPosts, fetchOptimalTimes]);


    if (status === 'loading') {
        return <Layout><div className="flex justify-center items-center h-screen"><p>Loading session...</p></div></Layout>;
    }
     if (status === 'unauthenticated') {
         // Redirect to login or show message
         // Example: Use Next.js router or simply show a message
         return <Layout><div className="text-center p-8"><p>Please <Link href="/login" className="text-blue-600 hover:underline">log in</Link> to access the Social Media Manager.</p></div></Layout>;
     }


    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold">Social Media Manager</h2>
                <p className="mt-1 text-sm text-gray-500">Design, schedule, and analyze your social media content.</p>
            </div>
            <SocialNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Render Tab Content Based on activeTab */}
            <div className="mt-8"> {/* Add margin top for content */}
                {activeTab === 'Composer' && (
                    <ComposerTabContent
                        // Pass necessary props
                        onPostScheduled={fetchScheduledPosts} // Callback to refresh schedule
                        scheduledPosts={scheduledPosts}
                        postContent={postContent}
                        setPostContent={setPostContent}
                        selectedPlatform={selectedPlatform}
                        setSelectedPlatform={setSelectedPlatform}
                        instagramAccounts={instagramAccounts}
                        pinterestBoards={pinterestBoards}
                        loading={loadingSocialData} // Use renamed loading state
                        userEmail={session?.user?.email} // <-- Correctly passing userEmail
                    />
                )}
                {activeTab === 'Analytics' && <AnalyticsTabContent />}
                {activeTab === 'Schedule' && (
                    <ScheduleTabWithNoSSR
                        scheduledPosts={scheduledPosts}
                        setScheduledPosts={setScheduledPosts}
                        calendarDate={calendarDate}
                        setCalendarDate={setCalendarDate}
                        view={view}
                        setView={setView}
                        optimalTimes={optimalTimes}
                    />
                )}
                {activeTab === 'Demographics' && <DemographicsTabContent />}
                {activeTab === 'Mailchimp' && <MailchimpTabContent />}
            </div>
            <CalenderModal id="CalenderModal" />
        </Layout>
    );
}
// --- END: MODIFIED SocialMediaManagerPage ---