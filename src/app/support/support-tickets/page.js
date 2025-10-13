'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/Layout';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Modal for creating a new ticket
const NewTicketModal = ({ isOpen, onClose, onTicketCreated }) => {
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('general');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, category, message }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to create ticket.');
            onTicketCreated();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Create Support Ticket</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                    <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        <option value="general">General Inquiry</option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing Question</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">How can we help?</label>
                    <textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Main component for the support page
export default function SupportPage() {
    const { status } = useSession();
    const router = useRouter();

    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTickets = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/support/tickets');
            if (!res.ok) throw new Error('Failed to load your support tickets.');
            const data = await res.json();
            setTickets(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/'); }
        if (status === 'authenticated') {
            fetchTickets();
        }
    }, [status, router, fetchTickets]);

    if (status === 'loading') {
        return <Layout><p className="p-6">Loading...</p></Layout>;
    }

    return (
        <Layout>
            <NewTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTicketCreated={fetchTickets} />
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold">Support Tickets</h2>
                    <p className="mt-1 text-sm text-gray-500">View your support history and create new tickets.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                        <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Create New Ticket
                    </button>
                </div>
            </div>

            <div className="mt-6 flow-root">
                <div className="inline-block min-w-full py-2 align-middle">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Subject</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="py-4 text-center text-gray-500">Loading tickets...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan="4" className="py-4 text-center text-red-500">{error}</td></tr>
                                ) : tickets.length > 0 ? (
                                    tickets.map((ticket) => (
					    <tr key={ticket.id} onClick={() => router.push(`/support/${ticket.id}`)} className="cursor-pointer hover:bg-gray-50">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{ticket.subject}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{ticket.category}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${ticket.status === 'open' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(ticket.updated_at).toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                <tr><td colSpan="4" className="py-4 text-center text-gray-500">You have no support tickets.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
