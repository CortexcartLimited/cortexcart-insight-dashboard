'use client';

import { useState } from 'react';
import moment from 'moment';

export default function SchedulerModal({
  isOpen,
  onClose,
  onScheduleConfirm,
  postContent,
  platform,
}) {
  const [date, setDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
  const [time, setTime] = useState('10:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setIsScheduling(true);
    setError('');
    try {
      const scheduledAt = moment(`${date}T${time}`).toISOString();
      if (moment(scheduledAt).isBefore(moment())) {
        throw new Error('You cannot schedule a post in the past.');
      }

      const response = await fetch('/api/social/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform,
          content: postContent,
          hashtags: [], 
          scheduledAt: scheduledAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to schedule the post.');
      }
      
      onScheduleConfirm(); 
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScheduling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 w-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Schedule Post</h3>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700">
            Time
          </label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isScheduling}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isScheduling ? 'Scheduling...' : 'Confirm Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}