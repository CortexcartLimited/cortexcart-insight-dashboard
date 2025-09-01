'use client';

import Layout from '@/app/components/Layout';

export default function TermsPage() {
    return (
        <Layout>
            <div className="bg-white px-6 py-12 lg:px-8">
                <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Terms of Service</h1>
                    <p className="mt-6 text-xl leading-8">
                        Welcome to CortexCart. These Terms of Service (&quot;Terms&quot;) govern your use of our website, dashboard, and the services we offer. By accessing or using our Service, you agree to be bound by these Terms.
                    </p>
                    <div className="mt-10 max-w-2xl">
                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">1. Use of Our Service</h2>
                        <p className="mt-6">
                            You must be at least 18 years old to use our Service. You are responsible for maintaining the security of your account and for all activities that occur under the account. You must notify us immediately of any unauthorized use of your account.
                        </p>
                        
                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">2. Beta Service</h2>
                        <p className="mt-6">
                            CortexCart is currently in a beta phase. This means that the Service is provided&quot;as is&quot; and &quot;as available&quot; without any warranties. We may change, suspend, or discontinue the Service or any part of it at any time without notice. We are not liable for any modification, suspension, or discontinuance of the Service.
                        </p>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">3. Intellectual Property</h2>
                        <p className="mt-6">
                            The Service and its original content, features, and functionality are and will remain the exclusive property of CortexCart and its licensors. Our trademarks may not be used in connection with any product or service without our prior written consent.
                        </p>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">4. Limitation of Liability</h2>
                        <p className="mt-6">
                            In no event shall CortexCart, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">5. Governing Law</h2>
                        <p className="mt-6">
                            These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.
                        </p>
                        
                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Contact Us</h2>
                        <p className="mt-6">
                            If you have any questions about these Terms, please contact us at support@cortexcart.com.
                        </p>
                        <p className="mt-4 text-sm text-gray-500">Last updated: June 20, 2025</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
