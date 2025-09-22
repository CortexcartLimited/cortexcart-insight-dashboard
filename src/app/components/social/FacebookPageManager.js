'use client';

// This component now receives pages and the handler function as props
export default function FacebookPageManager({ pages, instagramAccounts, onSetActive, onSetActiveIg, loading }) {
    if (loading) return <p className="text-sm text-gray-500 mt-4">Loading Facebook Pages...</p>;
    if (error) return <p className="text-sm text-red-500 mt-4">{error}</p>;

    return (
        <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-700">Connected Facebook Pages</h4>
            {pages.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">No pages found. Please try reconnecting your account to grant page permissions.</p>
            ) : (
                 <ul className="mt-2 space-y-3">
                {pages.map(page => {
                    const linkedIg = instagramAccounts.find(ig => ig.page_id === page.page_id);
                    return (
                        <li key={page.page_id} className="p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={page.picture_url} alt={page.page_name} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm font-medium">{page.page_name}</span>
                                </div>
                                <button
                                    // Use the corrected prop name here
                                    onClick={() => onSetActive(page.page_id)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${page.is_active ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    disabled={page.is_active}
                                >
                                    {page.is_active ? 'Active' : 'Set Active'}
                                </button>
                            </div>

                            {linkedIg && (
                                <div className="mt-3 ml-11 pl-4 border-l border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={linkedIg.profile_picture_url} alt={linkedIg.username} className="w-7 h-7 rounded-full" />
                                            <span className="text-sm text-gray-600">{linkedIg.username}</span>
                                        </div>
                                        <button
                                            // And use the corrected prop name here too
                                            onClick={() => onSetActiveIg(linkedIg.instagram_id)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${linkedIg.is_active ? 'bg-green-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                                            disabled={linkedIg.is_active}
                                        >
                                            {linkedIg.is_active ? 'Active' : 'Set Active'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            )}
        </div>
    );
}