'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer by telling react-big-calendar that we use moment.js for dates
const localizer = momentLocalizer(moment);

export default function SchedulerTabContent({ instagramAccounts, pinterestBoards, loading }) {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Fetch scheduled posts from your backend
    useEffect(() => {
        const fetchScheduledPosts = async () => {
            setIsLoading(true);
            try {
                // We will create this API route in a later step
                // const response = await fetch('/api/scheduled-posts');
                // const data = await response.json();
                
                // For now, we'll use dummy data
                const dummyData = [
                    {
                        id: 1,
                        title: 'Post to X: Our biggest sale is now live!...',
                        start: moment().add(1, 'days').set({ hour: 10, minute: 30 }).toDate(),
                        end: moment().add(1, 'days').set({ hour: 11, minute: 0 }).toDate(),
                        resource: { platform: 'x' } // Store extra data here
                    },
                    {
                        id: 2,
                        title: 'Post to Pinterest: New collection just dropped...',
                        start: moment().add(2, 'days').set({ hour: 14, minute: 0 }).toDate(),
                        end: moment().add(2, 'days').set({ hour: 14, minute: 30 }).toDate(),
                        resource: { platform: 'pinterest' }
                    }
                ];

                // The actual data would be mapped to the format react-big-calendar expects
                setEvents(dummyData);

            } catch (error) {
                console.error("Failed to fetch scheduled posts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchScheduledPosts();
    }, []);

    // Custom styling for calendar events based on platform
    const eventPropGetter = useCallback(
        (event) => {
            const platform = event.resource?.platform;
            let style = {
                borderRadius: '5px',
                border: 'none',
                color: 'white',
                display: 'block'
            };
            if (platform === 'x') {
                style.backgroundColor = '#1DA1F2'; // Twitter Blue
            } else if (platform === 'pinterest') {
                style.backgroundColor = '#E60023'; // Pinterest Red
            } else {
                style.backgroundColor = '#6B7280'; // Gray
            }
            return { style };
        },
        []
    );

    if (isLoading) {
        return <p>Loading schedule...</p>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border" style={{ height: '80vh' }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventPropGetter}
                views={['month', 'week', 'day']}
            />
        </div>
    );
}