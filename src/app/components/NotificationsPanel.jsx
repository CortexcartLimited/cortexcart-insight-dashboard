'use client';

import React from 'react';
import Link from 'next/link';

export default function NotificationsPanel({ notifications = [], onNotificationClick }) {
    return (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
            <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium text-gray-900">Notifications</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-4">No new notifications</p>
                ) : (
                    notifications.map((notif) => (
                        <Link key={notif.id} href={notif.link || '#'}>
                            <div
                                onClick={() => onNotificationClick(notif.id)}
                                className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer ${
                                    !notif.is_read ? 'bg-blue-50' : 'bg-white'
                                }`}
                            >
                                <p className={!notif.is_read ? 'font-semibold' : ''}>{notif.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notif.created_at).toLocaleString()}
                                </p>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
