'use client';
import { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const InstagramAccountManager = () => {
    const [accounts, setAccounts] = useState([]);
    const [activeAccount, setActiveAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInstagramData = async () => {
            setLoading(true);
            setError('');
            try {
                // --- START OF FIX 1 ---
                // Add { cache: 'no-store' } to prevent fetching stale data on load
                const res = await fetch('/api/social/instagram/accounts', { cache: 'no-store' });
                // --- END OF FIX 1 ---

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to load your Instagram accounts.');
                }
                const data = await res.json();
                setAccounts(data);
                const active = data.find(acc => acc.is_active);
                if(active) setActiveAccount(active);

            } catch (err) {
                setError(err.message);
                setAccounts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInstagramData();
    }, []);

    const handleSetActiveAccount = async (instagramId) => {
        try {
            setError(''); // Clear any previous errors
            const res = await fetch('/api/social/instagram/active-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instagramId }),
            });
            if (!res.ok) throw new Error('Failed to set active account.');
            
            // --- START OF FIX 2 ---
            // Add { cache: 'no-store' } to force-refresh the data
            const activeAccountRes = await fetch('/api/social/instagram/accounts', { cache: 'no-store' });
            // --- END OF FIX 2 ---
            
            if (activeAccountRes.ok) {
                const data = await activeAccountRes.json();
                setAccounts(data);
                const active = data.find(acc => acc.is_active);
                
                // --- START OF FIX 3 ---
                // Also update the 'activeAccount' state directly
                // This ensures the UI updates instantly
                setActiveAccount(active || null);
                // --- END OF FIX 3 ---
            }

        } catch (err) {
            setError(err.message);
        }
    };
    
    if (loading) return <p>Loading Instagram accounts...</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manage Connected Instagram Account</h3>
            {accounts.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {accounts.map((account) => (
                        <li key={account.instagram_id} className="py-3 flex items-center justify-between">
                            <span className="font-medium">{account.username}</span>
                             {activeAccount?.instagram_id === account.instagram_id ? (
                                <span className="flex items-center text-green-600">
                                    <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                                    Active
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleSetActiveAccount(account.instagram_id)}
                                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                                >
                                    Set as Active
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No Instagram Business accounts found. Please ensure your connected Facebook Page is linked to an Instagram Business account and you have granted permissions.</p>
            )}
        </div>
    );
};

export default InstagramAccountManager;