'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/Layout';
import { CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NotificationsPage() {
    const { status } = useSession();
    const router = useRouter();

    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to load notifications.');
            const data = await res.json();
            setNotifications(data);
        } catch (err) {
            setError(err.message instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/'); }
        if (status === 'authenticated') {
            fetchNotifications();
        }
    }, [status, router, fetchNotifications]);

    const handleMarkAsRead = async (notificationId) => {
        setNotifications(current =>
            current.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
        );
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId }),
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            fetchNotifications(); 
        }
    };

    const handleMarkAllAsRead = async () => {
        setNotifications(current =>
            current.map(n => ({ ...n, is_read: 1 }))
        );
        try {
            await fetch('/api/notifications', { method: 'PUT' });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            fetchNotifications();
        }
    };

    const hasUnread = notifications.some(n => !n.is_read);

    if (status === 'loading') {
        return <Layout><p className="p-6">Loading notifications...</p></Layout>;
    }

    return (
        <Layout>
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold">All Notifications</h2>
                    <p className="mt-1 text-sm text-gray-500">View your full notification history.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button 
                        onClick={handleMarkAllAsRead}
                        disabled={!hasUnread}
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
                        Mark all as read
                    </button>
                </div>
            </div>

            <div className="flow-root">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Message</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {isLoading ? (
                                <tr><td colSpan="3" className="py-4 text-center text-gray-500">Loading...</td></tr>
                            ) : error ? (
                                <tr><td colSpan="3" className="py-4 text-center text-red-500">{error}</td></tr>
                            ) : notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <tr key={notif.id} className={!notif.is_read ? 'bg-blue-50' : ''}>
                                        <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                            <Link href={notif.link || '#'}>
                                                <div className={`font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-500'} cursor-pointer hover:text-blue-600`}>
                                                    {notif.message}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(notif.created_at).toLocaleString()}</td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6">
                                            {!notif.is_read && (
                                                <button onClick={() => handleMarkAsRead(notif.id)} className="inline-flex items-center text-blue-600 hover:text-blue-900" title="Mark as read">
                                                    <EyeIcon className="h-5 w-5 mr-1" />
                                                    Mark as Read
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                            <tr><td colSpan="3" className="py-4 text-center text-gray-500">You have no notifications.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
