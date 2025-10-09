'use client';

import { useState } from 'react';
import { InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';

const alertStyles = {
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-400',
        icon: <InformationCircleIcon className="h-5 w-5 text-blue-400" />,
        title: 'text-blue-800',
        message: 'text-blue-700'
    },
    success: {
        bg: 'bg-green-50',
        border: 'border-green-400',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
        title: 'text-green-800',
        message: 'text-green-700'
    },
    warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-400',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />,
        title: 'text-yellow-800',
        message: 'text-yellow-700'
    },
    danger: {
        bg: 'bg-red-50',
        border: 'border-red-400',
        icon: <XCircleIcon className="h-5 w-5 text-red-400" />,
        title: 'text-red-800',
        message: 'text-red-700'
    },
};

export default function AlertBanner({ title, message, type }) {
    const [isVisible, setIsVisible] = useState(true);
    const styles = alertStyles[type] || alertStyles.info;

    if (!isVisible) {
        return null;
    }

    return (
        <div className={`rounded-md ${styles.bg} p-4 border-l-4 ${styles.border}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    {styles.icon}
                </div>
                <div className="ml-3">
                    <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
                    <div className={`mt-2 text-sm ${styles.message}`}>
                        <p>{message}</p>
                    </div>
                </div>
                <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                        <button
                            type="button"
                            onClick={() => setIsVisible(false)}
                            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.bg}`}
                        >
                            <span className="sr-only">Dismiss</span>
                            <XMarkIcon className={`h-5 w-5 ${styles.message}`} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
