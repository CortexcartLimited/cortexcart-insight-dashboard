// Path: src/app/components/RecentEventsTable.jsx

import React from 'react';

// A helper function to format the timestamp into a readable string
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
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

// A helper component to render event-specific badges
const EventBadge = ({ eventName }) => {
  const styles = {
    sale: 'bg-green-100 text-green-800',
    pageview: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };
  const style = styles[eventName] || styles.default;
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>
      {eventName}
    </span>
  );
};


const RecentEventsTable = ({ events = [] }) => {
  if (events.length === 0) {
    return <p className="text-gray-500">No recent events found.</p>;
  }

  return (
    <div className="overflow-x-auto h-full overflow-y-auto">
      {/* Added table-fixed to ensure columns respect their widths */}
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            {/* Added explicit widths to columns for better layout control */}
            <th scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th scope="col" className="w-1/2 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
            <th scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <EventBadge eventName={event.event_name} />
              </td>
              {/* Removed whitespace-nowrap and added break-words to allow text wrapping */}
              <td className="px-6 py-4 text-sm text-gray-800 break-words">
                {event.event_name === 'pageview' && `Viewed page: ${event.event_data.path || '/'}`}
                {event.event_name === 'sale' && `Sale of $${event.event_data.amount || 0}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatTimeAgo(event.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentEventsTable;
