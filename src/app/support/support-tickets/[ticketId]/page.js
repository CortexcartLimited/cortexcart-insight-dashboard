'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/app/components/Layout';
import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/solid';

// This component will render a single message in the thread
const TicketReply = ({ reply, isUser }) => {
    const authorName = isUser ? "You" : "CortexCart Support";
    const bgColor = isUser ? "bg-blue-100" : "bg-gray-100";

    return (
        <div className={`flex items-start space-x-4 p-4 rounded-lg ${bgColor}`}>
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{authorName}</p>
                    <p className="text-xs text-gray-500">
                        {new Date(reply.created_at).toLocaleString()}
                    </p>
                </div>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
            </div>
        </div>
    );
};

// This is the main page component
export default function ViewTicketPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { ticketId } = params;

    const [ticketData, setTicketData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/'); }
        if (status === 'authenticated' && ticketId) {
            const fetchTicket = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/support/tickets/${ticketId}`);
                    if (!res.ok) throw new Error('Could not load the ticket.');
                    const data = await res.json();
                    setTicketData(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTicket();
        }
    }, [status, router, ticketId]);

    if (isLoading || status === 'loading') {
        return <Layout><p className="p-6">Loading ticket...</p></Layout>;
    }
    
    if (error) {
        return <Layout><p className="p-6 text-red-500">{error}</p></Layout>;
    }

    return (
        <Layout>
            <div className="mb-8">
                <Link href="/support" className="text-sm text-blue-600 hover:underline">&larr; Back to all tickets</Link>
                <h2 className="text-3xl font-bold mt-2">{ticketData?.ticket.subject}</h2>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>Category: {ticketData?.ticket.category}</span>
                    <span>|</span>
                    <span>Status: 
                        <span className={`ml-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${ticketData?.ticket.status === 'open' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                           {ticketData?.ticket.status}
                        </span>
                    </span>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border max-w-4xl space-y-6">
                {ticketData?.replies.map(reply => (
                    <TicketReply key={reply.id} reply={reply} isUser={reply.author_email === session.user.email} />
                ))}
            </div>
        </Layout>
    );
}
