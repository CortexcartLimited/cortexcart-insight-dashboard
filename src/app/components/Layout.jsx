'use client';
import { useState, useEffect, useCallback } from 'react';
import TopNav from './TopNav';
import Footer from './Footer';
import OnboardingModal from './OnboardingModal';
import { useSession } from 'next-auth/react';
import Image from 'next/image'; // Import the Next.js Image component

const Layout = ({ children }) => {
    const { data: session, status } = useSession();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = useCallback(async () => {
        if (status === 'authenticated') {
            try {
                const res = await fetch('/api/notifications');
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        }
    }, [status]); // Dependency is status

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            if (!session.user.onboardingComplete) {
                setShowOnboarding(true);
            }
            fetchNotifications();
        }
    }, [status, session, fetchNotifications]); // FIX: Added fetchNotifications to the dependency array

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        if (session?.user) {
            session.user.onboardingComplete = true;
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex items-center space-x-4">
                    {/* FIX: Replaced <img> with <Image> */}
                    <Image
                        src="/cortexcart-com-logo.png"
                        alt="CortexCart Logo"
                        width={64}
                        height={64}
                        className="h-16 w-16"
                    />
                    <p className="text-lg font-semibold text-gray-700">Loading CortexCart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {status === 'authenticated' ? (
                <>
                    <TopNav notifications={notifications} />
                    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        {children}
                    </main>
               <OnboardingModal open={showOnboarding || false} onClose={handleOnboardingComplete} />
                               </>
            ) : (
                <>{children}</>
            )}
            <Footer />
        </div>
    );
};

export default Layout;