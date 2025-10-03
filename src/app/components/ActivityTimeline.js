'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, CursorArrowRaysIcon, BanknotesIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import SkeletonCard from './SkeletonCard';

// Helper to assign an icon and color to each event type
const getEventVisuals = (eventName) => {
    switch (eventName) {
        case 'page view':
            return { Icon: EyeIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' };
        case 'click':
            return { Icon: CursorArrowRaysIcon, color: 'text-green-500', bgColor: 'bg-green-50' };
        case 'sale':
            return { Icon: BanknotesIcon, color: 'text-amber-500', bgColor: 'bg-amber-50' };
        default:
            return { Icon: QuestionMarkCircleIcon, color: 'text-gray-500', bgColor: 'bg-gray-50' };
    }
};

// Helper to format the time since the event occurred
const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};


const ActivityTimeline = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/events'); // Your existing API route for events
                if (!response.ok) {
                    throw new Error('Failed to fetch recent events.');
                }
                const data = await response.json();
                setEvents(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return <SkeletonCard />;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">Error: {error}</div>;
    }
    
    if (events.length === 0) {
        return <div className="text-center p-4 text-gray-500">No recent activity to display.</div>
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {events.map((event, eventIdx) => {
                    const { Icon, color, bgColor } = getEventVisuals(event.event_name);
                    const path = event.event_data?.path || 'an unknown page';

                    return (
                        <li key={event.id}>
                            <div className="relative pb-8">
                                {eventIdx !== events.length - 1 ? (
                                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${bgColor}`}>
                                            <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                New <span className="font-medium text-gray-900">{event.event_name}</span> on {path}
                                            </p>
                                        </div>
                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                            <time dateTime={event.created_at}>{timeSince(event.created_at)}</time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default ActivityTimeline;