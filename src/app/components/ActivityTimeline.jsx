'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; 
import { EyeIcon, CursorArrowRaysIcon, BanknotesIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import SkeletonCard from './SkeletonCard';

// These helper functions do not need to change
const getEventVisuals = (eventName) => {
    switch (eventName) {
        case 'page view': return { Icon: EyeIcon, color: 'text-blue-500', bgColor: 'bg-blue-50' };
        case 'click': return { Icon: CursorArrowRaysIcon, color: 'text-green-500', bgColor: 'bg-green-50' };
        case 'sale': return { Icon: BanknotesIcon, color: 'text-amber-500', bgColor: 'bg-amber-50' };
        default: return { Icon: QuestionMarkCircleIcon, color: 'text-gray-500', bgColor: 'bg-gray-50' };
    }
};
const timeSince = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 3600;
    if (interval > 24) return Math.floor(interval / 24) + " days ago";
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const ActivityTimeline = ({ dateRange }) => { 
    const { data: session, status } = useSession(); 
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
  useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            const fetchEvents = async () => {
                setLoading(true);
                setError(null);
                try {
                    let url = `/api/events?siteId=${session.user.email}`;

                    // --- FIX: Check if dateRange and its properties exist ---
                    if (dateRange && dateRange.startDate && dateRange.endDate) {
                        url += `&startDate=${dateRange.startDate.toISOString().split('T')[0]}`;
                        url += `&endDate=${dateRange.endDate.toISOString().split('T')[0]}`;
                    }
                    
                    const response = await fetch(url); 
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'A data fetch failed: Bad Request');
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
        } else if (status === 'loading') {
            setLoading(true);
        }
    }, [session, dateRange, status]);


    if (loading) { return <SkeletonCard />; }
    if (error) { return <div className="text-red-500 text-center p-4">Error: {error}</div>; }
    if (events.length === 0) { return <div className="text-center p-4 text-gray-500">No recent activity to display.</div> }

    return (
        // The JSX for the timeline remains the same
         <div className="h-96 overflow-y-auto pr-4 -mr-4">
             <div className="flow-root">
            <ul className="-mb-8">
                {events.map((event, eventIdx) => {
                    const { Icon, color, bgColor } = getEventVisuals(event.event_name);
                    const path = event.event_data ? JSON.parse(event.event_data).path : 'N/A';
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
        </div>

    );
};

export default ActivityTimeline;