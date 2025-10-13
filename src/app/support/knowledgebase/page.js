'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/Layout';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// A comprehensive list of FAQs based on our application features
const faqs = [
    {
        question: "What is CortexCart?",
        answer: "CortexCart is an e-commerce analytics platform designed to give you actionable insights into your store's performance. It uses AI to provide recommendations on how to improve your sales, homepage, and product listings.",
        category: "General"
    },
    {
        question: "How do I install the tracking script?",
        answer: "You can find your unique tracking script in Settings > Widget Settings. This script should be placed just before the closing `</head>` tag on every page of your website. We also provide specific installation guides for popular platforms like Shopify and WooCommerce under the 'Install Guides' section.",
        category: "Installation"
    },
    {
        question: "Is my website and customer data safe?",
        answer: "Yes. We take data security very seriously. The tracking script only collects anonymized data about page views, device types, and sales events. It does not collect any personally identifiable information (PII) about your customers. All sensitive credentials you provide, like API keys, are encrypted at rest in our database.",
        category: "Data & Privacy"
    },
    {
        question: "How do the AI recommendations work?",
        answer: "Our AI, powered by Google's Gemini models, analyzes your website's data. For homepage analysis, it fetches your site's HTML to evaluate SEO, performance, and copywriting. For product analysis, it looks at underperforming products (high views, no sales) and suggests improved titles and descriptions.",
        category: "AI Features"
    },
    {
        question: "How often can I generate an AI report?",
        answer: "During the beta period, you can generate one Homepage Analysis report and one Product Analysis report every 24 hours. This is to ensure fair usage for all our beta users.",
        category: "AI Features"
    },
    {
        question: "What do the different dashboard stats mean?",
        answer: "Total Revenue is the total monetary value of all sales recorded. Total Sales is the count of individual sale events. Page Views is the total number of times any page with the tracker was loaded. The live visitor count shows the number of unique visitors active on your site in the last 5 minutes.",
        category: "Dashboard"
    },
    {
        question: "How do I connect my social media accounts?",
        answer: "You can connect your social media accounts and manage API credentials from the 'Social Connections' tab in the Settings page. This feature is currently under development and will be available soon.",
        category: "Social Media"
    },
    {
        question: "How do I delete my account?",
        answer: "You can permanently delete your account and all associated data from the 'Danger Zone' in the Settings page. Please be aware that this action is irreversible and will remove all your site analytics, reports, and settings.",
        category: "Account"
    },
   {
	question: "How do you get the Google Analytics 4 Property ID?",
	answer: "You can get this in your google Analytics dashboard, select Property Details in the property settings/property details link, at the top of this page on the right is your PROPERTY ID: 000000 where 00000 is your actual property ID",
	category: "Settings",
   }
];

export default function FaqPage() {
    const { status } = useSession();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredFaqs, setFilteredFaqs] = useState(faqs);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    // Filter FAQs based on search term
    useEffect(() => {
        if (searchTerm === '') {
            setFilteredFaqs(faqs);
        } else {
            const lowercasedFilter = searchTerm.toLowerCase();
            const filtered = faqs.filter(faq =>
                faq.question.toLowerCase().includes(lowercasedFilter) ||
                faq.answer.toLowerCase().includes(lowercasedFilter)
            );
            setFilteredFaqs(filtered);
        }
    }, [searchTerm]);

    if (status === 'loading') {
        return <Layout><p className="p-6">Loading...</p></Layout>;
    }

    return (
        <Layout>
            <div className="bg-white">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Frequently Asked Questions</h2>
                        <p className="mt-4 text-lg leading-8 text-gray-600">
                            Can’t find the answer you’re looking for? Reach out to our support team.
                        </p>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="mt-12 max-w-2xl mx-auto">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="search"
                                name="search"
                                className="block w-full rounded-md border-0 bg-white py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="Search for a question..."
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* FAQ List */}
                    <div className="mx-auto mt-10 max-w-4xl divide-y divide-gray-900/10">
                        <dl className="space-y-6 divide-y divide-gray-900/10">
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq) => (
                                    <details key={faq.question} className="group pt-6">
                                        <summary className="flex w-full cursor-pointer items-center justify-between text-left text-gray-900">
                                            <span className="text-base font-semibold leading-7">{faq.question}</span>
                                            <span className="ml-6 flex h-7 items-center">
                                                <svg className="h-6 w-6 group-open:hidden" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                                                </svg>
                                                <svg className="hidden h-6 w-6 group-open:block" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                                                </svg>
                                            </span>
                                        </summary>
                                        <div className="mt-2 pr-12">
                                            <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                                        </div>
                                    </details>
                                ))
                            ) : (
                                <div className="pt-6 text-center text-gray-500">
                                    <p>No questions found. Try a different search term.</p>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
