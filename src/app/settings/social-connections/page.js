import { Suspense } from 'react';
import Layout from '@/app/components/Layout';
import SocialConnectionsClient from './SocialConnectionsClient';
import Link from 'next/link';



// A simple loading component to show while the client component loads
function Loading() {
    return (
        <div className="p-6 border rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold text-gray-800">Connect Your Accounts</h3>
            <div className="mt-4 space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-full"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
        </div>
    );
}

export default function SocialConnectionsPage() {
    return (
        <Layout>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-gray-800">Social Connections</h2>
                <Link href="/settings" className="flex items-right text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
                    Back to Settings Page
                </Link>
            </div>
            <span className="text-gray-500 mb-8">Manage your connected social media accounts.</span>
            <Suspense fallback={<Loading />}>
                <SocialConnectionsClient />
            </Suspense>
        </Layout>
    );
}