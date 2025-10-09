'use client';

import Layout from '@/app/components/Layout';

export default function PrivacyPage() {
    return (
        <Layout>
            <div className="bg-white px-6 py-12 lg:px-8">
                <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                 <main class="container">
        <h1>Privacy Policy</h1>
        
        <p><strong>Last updated:</strong> September 12, 2025</p>

        <p>Your privacy is important to us. It is CortexCart's policy to respect your privacy regarding any information we may collect from you across our website and services.</p>

        <h2 className="mt-4">1. Information We Collect & How We Use It</h2>
        <ul>
            <li><strong>Personal Information:</strong> When you register for an account, we collect basic information such as your name and email address provided by your chosen authentication provider (e.g., Google). We use this information to create and manage your account, communicate with you, and provide you with our services.</li>
            <li><strong>Website & Analytics Data:</strong> Through our tracking script installed on your website, we collect anonymized and aggregated data about your website visitors. This data is used solely to populate your private dashboard and power our AI recommendation engines for your benefit. We do not collect personally identifiable information about your customers.</li>
            <li><strong>User-Provided Content:</strong> We collect the information you provide when you set your site URL, use our AI features, or connect your social media accounts. All sensitive credentials, such as API keys, are encrypted at rest.</li>
        </ul>

        <h2 className="mt-4">2. Sharing and Disclosure of Information</h2>
        <p>We do not sell, trade, or rent your personal identification information to others. We may share or disclose your information only in the following limited circumstances:</p>
        <ul>
            <li><strong>With Your Consent:</strong> We may share information with your explicit consent.</li>
            <li><strong>To Provide the Service:</strong> The data and analytics collected from your website are displayed back to you within your private dashboard. We do not share this data with any other party.</li>
            <li><strong>Service Providers:</strong> We may share information with trusted third-party service providers who assist us in operating our service, such as cloud hosting providers or payment processors. These parties are bound by confidentiality agreements and are only permitted to use the information to perform the services we have requested.</li>
            <li><strong>Legal Requirements:</strong> We will disclose your information where required to do so by law or subpoena or if we reasonably believe that such action is necessary to comply with the law and the reasonable requests of law enforcement.</li>
            <li><strong>Google User Data:</strong> Specifically, user data obtained from Google's authentication services (such as your name and email) is used only for authentication and account management within CortexCart. <strong>This data is not shared, transferred, or disclosed to any third party</strong>, except as necessary to comply with applicable law or as part of a security investigation.</li>
        </ul>

        <h2 className="mt-4">3. Data Security</h2>
        <p>We take data security seriously. We use a combination of technical, administrative, and physical controls to maintain the security of your data. Sensitive information, such as social media credentials, is encrypted using industry-standard algorithms before being stored in our database.</p>

        <h2 className="mt-4">4. Your Data Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time. You can manage your site settings from the settings page. You can also delete your entire account and all associated data from the "Danger Zone" in your settings, which is an irreversible action.</p>

        <h2 className="mt-4">Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@cortexcart.com">privacy@cortexcart.com</a>.</p>
    </main>
                </div>
            </div>
        </Layout>
    );
}
