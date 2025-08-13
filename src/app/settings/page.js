'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Layout from '@/app/components/Layout';
import SettingsTabs from '@/app/components/SettingsTabs';
import { CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import AlertBanner from '@/app/components/AlertBanner';
import { useRouter, useSearchParams } from "next/navigation";
import QuickBooksConnect from '@/app/components/QuickBooksConnect';
import Image from 'next/image';

const tabs = [
    { name: 'General', href: '#' },
    { name: 'Integrations', href: '#' },
    { name: 'Social Connections', href: '#' },
    { name: 'Platforms', href: '#' },
    { name: 'Widget Settings', href: '#' },
    { name: 'Billing', href: '#' },
    { name: 'Danger Zone', href: '#' },
];

// --- General Settings Component ---
const GeneralTabContent = () => {
    // All state and logic for this tab is self-contained
    const [siteName, setSiteName] = useState('');
    const [siteUrl, setSiteUrl] = useState('');
    const [formMessage, setFormMessage] = useState({ text: '', isError: false });
    // ... plus any other state needed for this component
    
    useEffect(() => {
        // Fetch data specific to this component
    }, []);

    const handleSaveSettings = async (e) => {
        // Handle saving settings
    };
    
    return <div>General Settings Content</div>;
};

// --- Integrations Settings Component ---
const IntegrationsTabContent = () => {
    // All state and logic for this tab is self-contained
    return <div>Integrations Content</div>;
};

// ... You would create similar self-contained components for other tabs ...
// SocialConnectionsTabContent, PlatformsTabContent, etc.


// ========================================================================
// THIS IS THE MAIN CLIENT COMPONENT THAT USES THE HOOKS
// ========================================================================
function SettingsPageClient() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // State is now managed at this level
    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
    const [connectionStatus, setConnectionStatus] = useState({});

    // Fetch connection statuses
    const fetchConnections = useCallback(async () => {
        // ... your fetch logic
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    // Handle tab switching based on URL
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        const connectStatus = searchParams.get('connect_status');

        if (tabFromUrl) {
            const tabExists = tabs.find(t => t.name.toLowerCase().replace(/ /g, '-') === tabFromUrl.toLowerCase());
            if (tabExists) {
                setActiveTab(tabExists.name);
            }
        }
        
        if (connectStatus) {
            const message = connectStatus === 'success' 
                ? 'Account connected successfully!' 
                : searchParams.get('message')?.replace(/_/g, ' ') || 'An unknown error occurred.';
            setAlert({ show: true, message, type: connectStatus === 'success' ? 'success' : 'danger' });
            fetchConnections();
            // Clean the URL
            router.replace(`/settings?tab=${tabFromUrl || 'platforms'}`);
        }
    }, [searchParams, fetchConnections, router]);
    
    if (status === 'loading') { 
        return <Layout><div className="p-8">Loading...</div></Layout>; 
    }
    
    if (status === 'unauthenticated') {
        router.push('/');
        return null;
    }

    // Render the correct tab based on state
    const renderTabContent = () => {
        switch (activeTab) {
            case 'General': return <GeneralTabContent />;
            case 'Integrations': return <IntegrationsTabContent />;
            // Add other cases here
            // case 'Social Connections': return <SocialConnectionsTabContent ... />;
            // case 'Platforms': return <PlatformsTabContent ... />;
            default: return <GeneralTabContent />;
        }
    };
    
    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold">Settings</h2>
                <p className="mt-1 text-sm text-gray-500">Manage your site settings, integrations, and tracking.</p>
                {alert.show && <AlertBanner title={alert.type === 'success' ? 'Success' : 'Error'} message={alert.message} type={alert.type} onClose={() => setAlert({ show: false, message: '', type: 'info' })} />}
            </div>
 
            <SettingsTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
 
            <div className="mt-8 bg-white p-8 rounded-lg">
                {renderTabContent()}
            </div>
        </Layout>
    );
}

// ========================================================================
// THIS IS THE FINAL PAGE EXPORT
// It's a simple component whose only job is to wrap our client component in <Suspense>
// ========================================================================
export default function SettingsPage() {
    return (
        <Suspense fallback={<Layout><div className="p-8">Loading Page...</div></Layout>}>
            <SettingsPageClient />
        </Suspense>
    );
}