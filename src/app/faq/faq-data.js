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

// Export the array so other files can use it
module.exports = { faqs };
