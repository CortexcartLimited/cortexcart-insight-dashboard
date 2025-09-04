'use client';

import Layout from '@/app/components/Layout';

export default function DataProtectionPage() {
    return (
        <Layout>
            <div className="bg-white px-6 py-12 lg:px-8">
                <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Data Protection & GDPR</h1>
                    <p className="mt-6 text-xl leading-8">
                        We are committed to protecting your data and complying with the General Data Protection Regulation (GDPR). This page outlines our principles and your rights.
                    </p>
                    <div className="mt-10 max-w-2xl">
                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Our Data Principles</h2>
                        <ul className="mt-6 list-disc space-y-4 pl-6">
                            <li><strong>Data Minimization:</strong> We only collect the data that is essential to provide our service. For your website&apos;s visitors, we collect only anonymized data (like page views and device type) and never any Personally Identifiable Information (PII).</li>
                            <li><strong>Purpose Limitation:</strong> The analytics data we collect from your site is used solely to populate your dashboard and power our AI recommendation engines for your benefit. We will never sell or share your site&apos;s data with third parties.</li>
                            <li><strong>Security:</strong> All sensitive data, such as account credentials and API keys, are encrypted at rest in our database using industry-standard AES-256-GCM encryption.</li>
                        </ul>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Your Rights Under GDPR</h2>
                        <p className="mt-6">
                            As a user of CortexCart, you have several rights regarding your personal data:
                        </p>
                        <ul className="mt-6 list-disc space-y-4 pl-6">
                            <li><strong>The Right to Access:</strong> You can request a copy of the personal data we hold about you at any time.</li>
                            <li><strong>The Right to Rectification:</strong> You can update your personal information, such as your name and site details, directly from the Settings page.</li>
                            <li><strong>The Right to Erasure (Right to be Forgotten):</strong> You can permanently delete your account and all associated data from the &quote;Danger Zone&quote; in your Settings. This action is irreversible.</li>
                        </ul>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Contact Us</h2>
                        <p className="mt-6">
                            If you have any questions about our data protection practices or wish to exercise any of your rights, please contact our Data Protection Officer at <a href="mailto:privacy@cortexcart.com" className="text-blue-600 hover:underline">privacy@cortexcart.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
