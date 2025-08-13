'use client';

import Layout from '@/app/components/Layout';

export default function PrivacyPage() {
    return (
        <Layout>
            <div className="bg-white px-6 py-12 lg:px-8">
                <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Privacy Policy</h1>
                    <p className="mt-6 text-xl leading-8">
                        Your privacy is important to us. It is CortexCart's policy to respect your privacy regarding any information we may collect from you across our website and services.
                    </p>
                    <div className="mt-10 max-w-2xl">
                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">1. Information We Collect</h2>
                        <p className="mt-6">
                           <strong>Personal Information:</strong> When you register for an account, we collect information such as your name and email address provided by your chosen authentication provider (e.g., Google).
                        </p>
                        <p className="mt-4">
                           <strong>Website & Analytics Data:</strong> Through our tracking script installed on your website, we collect anonymized and aggregated data about your website's visitors, including page views, sales events, device types, geographic locations, and referrers. We do not collect personally identifiable information about your customers.
                        </p>
                         <p className="mt-4">
                           <strong>User-Provided Content:</strong> We collect the information you provide when you set your site URL, use our AI features, or connect your social media accounts. All sensitive credentials, such as API keys, are encrypted at rest.
                        </p>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">2. How We Use Your Information</h2>
                        <p className="mt-6">
                            We use the information we collect to operate, maintain, and provide you with the features and functionality of the Service. The analytics data from your website is used solely to populate your private dashboard and to power the AI recommendation engines for your benefit. We may use your email address to send you service-related notices.
                        </p>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">3. Data Security</h2>
                        <p className="mt-6">
                            We take data security seriously. We use a combination of technical, administrative, and physical controls to maintain the security of your data. Sensitive information, such as social media credentials, is encrypted using industry-standard algorithms before being stored in our database.
                        </p>
                        
                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">4. Your Data Rights</h2>
                        <p className="mt-6">
                            You have the right to access, update, or delete your personal information at any time. You can manage your site settings from the settings page. You can also delete your entire account and all associated data from the "Danger Zone" in your settings, which is an irreversible action.
                        </p>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Contact Us</h2>
                        <p className="mt-6">
                            If you have any questions about this Privacy Policy, please contact us at privacy@cortexcart.com.
                        </p>
                        <p className="mt-4 text-sm text-gray-500">Last updated: June 20, 2025</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
