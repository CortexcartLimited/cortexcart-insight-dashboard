'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { encrypt } from '@/lib/crypto';

const SettingsTabs = ({ activeTab }) => {
    const router = useRouter();
    const { data: session, update } = useSession();
    const [currentTab, setCurrentTab] = useState(activeTab);

    // State for Profile Tab
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // State for Platforms Tab
    const [siteUrl, setSiteUrl] = useState('');
    const [connections, setConnections] = useState({});
    const [facebookPages, setFacebookPages] = useState([]);
    const [activeFacebookPage, setActiveFacebookPage] = useState(null);
    const [instagramAccounts, setInstagramAccounts] = useState([]);
    const [activeInstagramAccount, setActiveInstagramAccount] = useState(null);
    const [pinterestBoards, setPinterestBoards] = useState([]);
    const [showScheduler, setShowScheduler] = useState(false);
    
    // State for GA4 Tab
    const [ga4Credentials, setGa4Credentials] = useState({
        propertyId: '',
        credentials: ''
    });

    useEffect(() => {
        if (session) {
            setName(session.user.name || '');
            setEmail(session.user.email || '');
            setSiteUrl(session.user.siteUrl || '');
        }
    }, [session]);

    useEffect(() => {
        async function fetchConnections() {
            const res = await fetch('/api/social/connections/status');
            if (res.ok) {
                const data = await res.json();
                setConnections(data);
            }
        }

        async function fetchFacebookPages() {
            try {
                const response = await fetch('/api/social/facebook/pages');
                if (response.ok) {
                    const data = await response.json();
                    setFacebookPages(data.pages || []);
                }
            } catch (error) {
                console.error('Failed to fetch Facebook pages:', error);
            }
        }

        async function fetchActiveFacebookPage() {
            try {
                const response = await fetch('/api/social/facebook/active-page');
                if (response.ok) {
                    const data = await response.json();
                    setActiveFacebookPage(data.page);
                }
            } catch (error) {
                console.error('Failed to fetch active Facebook page:', error);
            }
        }

        async function fetchInstagramAccounts() {
            try {
                const response = await fetch('/api/social/instagram/accounts');
                if (response.ok) {
                    const data = await response.json();
                    setInstagramAccounts(data.accounts || []);
                }
            } catch (error) {
                console.error('Failed to fetch Instagram accounts:', error);
            }
        }

        async function fetchActiveInstagramAccount() {
            try {
                const response = await fetch('/api/social/instagram/active-accounts');
                if (response.ok) {
                    const data = await response.json();
                    setActiveInstagramAccount(data.account);
                }
            } catch (error) {
                console.error('Failed to fetch active Instagram account:', error);
            }
        }

        async function fetchPinterestBoards() {
            try {
                const response = await fetch('/api/social/pinterest/boards');
                if (response.ok) {
                    const data = await response.json();
                    setPinterestBoards(data.boards || []);
                }
            } catch (error) {
                console.error('Failed to fetch Pinterest boards:', error);
            }
        }

        async function fetchGa4Credentials() {
            try {
                const response = await fetch('/api/ga4/credentials');
                if (response.ok) {
                    const data = await response.json();
                    setGa4Credentials({
                        propertyId: data.propertyId || '',
                        credentials: data.credentials ? JSON.stringify(data.credentials, null, 2) : ''
                    });
                }
            } catch (error) {
                console.error('Failed to fetch GA4 credentials:', error);
            }
        }

        fetchConnections();
        fetchFacebookPages();
        fetchActiveFacebookPage();
        fetchInstagramAccounts();
        fetchActiveInstagramAccount();
        fetchPinterestBoards();
        fetchGa4Credentials();
    }, []);

    const handleTabClick = (tabName) => {
        setCurrentTab(tabName);
        router.push(`/settings?tab=${tabName}`, undefined, { shallow: true });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        // Update logic here
    };

    const handleConnect = (platform) => {
        window.location.href = `/api/connect/${platform}`;
    };

    const handleConnectFacebookPage = async (pageId) => {
        try {
            const response = await fetch('/api/social/facebook/connect-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId }),
            });
            if (response.ok) {
                const data = await response.json();
                setActiveFacebookPage({ id: pageId, name: data.name });
                alert('Page connected successfully!');
            }
        } catch (error) {
            console.error('Failed to connect Facebook page:', error);
        }
    };
    
    const handleConnectInstagram = async (accountId) => {
        try {
            const response = await fetch('/api/social/instagram/connect-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId }),
            });
            if (response.ok) {
                const data = await response.json();
                setActiveInstagramAccount({ id: accountId, username: data.username });
                alert('Account connected successfully!');
            }
        } catch (error) {
            console.error('Failed to connect Instagram account:', error);
        }
    };

    const handleGa4Update = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/ga4/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: ga4Credentials.propertyId,
                    credentials: JSON.parse(ga4Credentials.credentials)
                }),
            });
            if (response.ok) {
                alert('GA4 credentials updated successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to update GA4 credentials: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error updating GA4 credentials:', error);
            alert('An error occurred while updating GA4 credentials. Please check the console for details.');
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                const response = await fetch('/api/account/delete', {
                    method: 'DELETE',
                });
                if (response.ok) {
                    alert('Account deleted successfully.');
                    // Log the user out and redirect to homepage
                } else {
                    alert('Failed to delete account.');
                }
            } catch (error) {
                console.error('Error deleting account:', error);
            }
        }
    };

    const tabs = [
        { name: 'Profile' },
        { name: 'Platforms' },
        { name: 'GA4' },
        { name: 'Billing' },
        { name: 'Account' },
    ];

    const renderTabContent = () => {
        const tab = tabs.find(t => t.name === currentTab);
        if (!tab) return null;

        if (tab.name === 'Profile') {
            return (
                <Card>
                    <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium">Name</label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium">Email</label>
                                    <Input id="email" type="email" value={email} disabled />
                                </div>
                                <div>
                                    <label htmlFor="siteUrl" className="block text-sm font-medium">Site URL</label>
                                    <Input id="siteUrl" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
                                </div>
                                <Button type="submit">Update Profile</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            );
        } else if (tab.name === 'Platforms') {
            return (
                <Card>
                    <CardHeader><CardTitle>Connect Your Platforms</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(connections).map(([platform, status]) => (
                                <div key={platform} className="p-4 border rounded-lg flex items-center justify-between">
                                    <span className="capitalize">{platform}</span>
                                    <Button onClick={() => handleConnect(platform)} disabled={status}>
                                        {status ? 'Connected' : 'Connect'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <hr/>
                        <div>
                            <h3 className="text-lg font-medium">Your Facebook Pages</h3>
                            {facebookPages.length > 0 ? (
                                <ul className="space-y-2">
                                    {facebookPages.map((page) => (
                                        <li key={page.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                            <span>{page.name}</span>
                                            <Button onClick={() => handleConnectFacebookPage(page.id)} size="sm">
                                                {activeFacebookPage && activeFacebookPage.id === page.id ? 'Active' : 'Set Active'}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p>No Facebook pages found. Connect Facebook to see your pages.</p>}
                        </div>
                        <hr/>
                        <div>
                            <h3 className="text-lg font-medium">Your Instagram Accounts</h3>
                            {instagramAccounts.length > 0 ? (
                                <ul className="space-y-2">
                                    {instagramAccounts.map((acc, index) => {
                                        let username = '';
                                        try {
                                            if (typeof acc.account_details === 'string') {
                                                const details = JSON.parse(acc.account_details);
                                                username = details.username;
                                            } else if (acc.account_details && typeof acc.account_details === 'object') {
                                                username = acc.account_details.username;
                                            }
                                        } catch (e) {
                                            console.error("Failed to parse Instagram account details:", acc.account_details, e);
                                            username = "Invalid Account Data"; // Fallback text
                                        }

                                        return (
                                            <li key={index} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                                <span>{username}</span>
                                                <Button onClick={() => handleConnectInstagram(acc.id)} size="sm">
                                                    {activeInstagramAccount && activeInstagramAccount.id === acc.id ? 'Active' : 'Set Active'}
                                                </Button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : <p>No Instagram accounts connected.</p>}
                        </div>
                    </CardContent>
                </Card>
            );
        } else if (tab.name === 'GA4') {
            return (
                <Card>
                    <CardHeader><CardTitle>Google Analytics 4</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleGa4Update} className="space-y-4">
                            <div>
                                <label htmlFor="propertyId" className="block text-sm font-medium">Property ID</label>
                                <Input
                                    id="propertyId"
                                    value={ga4Credentials.propertyId}
                                    onChange={(e) => setGa4Credentials(prev => ({ ...prev, propertyId: e.target.value }))}
                                    placeholder="e.g., 123456789"
                                />
                            </div>
                            <div>
                                <label htmlFor="credentials" className="block text-sm font-medium">Credentials JSON</label>
                                <textarea
                                    id="credentials"
                                    rows="10"
                                    className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800"
                                    value={ga4Credentials.credentials}
                                    onChange={(e) => setGa4Credentials(prev => ({ ...prev, credentials: e.target.value }))}
                                    placeholder="Paste your GA4 service account credentials JSON here"
                                ></textarea>
                            </div>
                            <Button type="submit">Save Credentials</Button>
                        </form>
                    </CardContent>
                </Card>
            );
        } else if (tab.name === 'Account') {
            return (
                <Card>
                    <CardHeader><CardTitle>Account Management</CardTitle></CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
                        <p className="text-sm text-gray-500 mt-2">
                            Permanently delete your account and all associated data. This action is irreversible.
                        </p>
                    </CardContent>
                </Card>
            );
        }
        return <Card><CardHeader><CardTitle>{tab.name}</CardTitle></CardHeader><CardContent>Content for {tab.name}</CardContent></Card>;
    };

    return (
        <div className="flex">
            <aside className="w-48">
                <nav className="flex flex-col space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => handleTabClick(tab.name)}
                            className={`px-4 py-2 text-left rounded-md ${currentTab === tab.name ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 ml-8">
                {renderTabContent()}
            </main>
        </div>
    );
};

export default SettingsTabs;