'use client';

import Layout from '@/app/components/Layout';

export default function AboutPage() {
    return (
        <Layout>
            <div className="bg-white py-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">About CortexCart</h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Empowering e-commerce businesses with the insights they need to grow, innovate, and succeed.
                        </p>
                    </div>

                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-gray-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                                        </svg>
                                    </div>
                                    Our Story
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-gray-600">
                                    CortexCart was born from a simple observation: small to medium-sized e-commerce businesses were being priced out of high-quality analytics. We saw a gap for a tool that was not only powerful and insightful but also accessible. We started with the mission to democratize data and provide every store owner with the AI-powered insights typically reserved for large corporations.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-gray-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                         <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-2.25M19.5 12l-3.75 2.25" />
                                        </svg>
                                    </div>
                                    Our Vision
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-gray-600">
                                    Our vision is to build a complete e-commerce intelligence platform. We aim to go beyond simple analytics, providing tools for AI-driven content creation, social media management, and deep customer engagement. We want to be the central nervous system for online stores, providing clarity and direction in a complex digital marketplace.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
