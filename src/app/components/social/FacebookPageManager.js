'use client';

// This component now receives pages and the handler function as props
export default function FacebookPageManager({ pages, onSetActive, error, loading }) {
    if (loading) return <p className="text-sm text-gray-500 mt-4">Loading Facebook Pages...</p>;
    if (error) return <p className="text-sm text-red-500 mt-4">{error}</p>;

    return (
        <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-700">Connected Facebook Pages</h4>
            {pages.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">No pages found. Please try reconnecting your account to grant page permissions.</p>
            ) : (
                <ul className="mt-2 space-y-3">
                    {pages.map(page => (
                        <li key={page.page_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-3">
                                {page.picture_url && <img src={page.picture_url} alt={page.page_name} className="w-8 h-8 rounded-full" />}
                                <span className="text-sm font-medium">{page.page_name}</span>
                            </div>
                            <button
                                onClick={() => onSetActive(page.page_id)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                    page.is_active
                                        ? 'bg-green-600 text-white cursor-default'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                disabled={page.is_active}
                            >
                                {page.is_active ? 'Active' : 'Set Active'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}