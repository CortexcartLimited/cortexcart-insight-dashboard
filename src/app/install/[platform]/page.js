'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/app/components/Layout';
import Link from 'next/link';

// Placeholder content for instructions for all platforms
const instructions = {
  shopify: {
    title: "Shopify Installation Guide",
    steps: [
      "From your Shopify admin, go to Online Store > Themes.",
      "Find the theme you want to edit, and then click Actions > Edit code.",
      "In the Layout directory, click `theme.liquid` to open the file in the code editor.",
      "Find the closing `</head>` tag in the code.",
      "Paste your CortexCart tracker snippet on a new line just before the closing `</head>` tag.",
      "Click Save. You're all set!",
    ],
  },
  woocommerce: {
    title: "WooCommerce (WordPress) Installation Guide",
    steps: [
        "The easiest method is to use a plugin that allows you to insert headers and footers.",
        "From your WordPress dashboard, go to Plugins > Add New and search for 'Insert Headers and Footers'.",
        "Install and activate a suitable plugin (e.g., WPCode, Insert Headers and Footers by WPBeginner).",
        "Navigate to the plugin's settings page (often under Settings > WPCode or similar).",
        "Paste your CortexCart tracker snippet into the 'Header' section.",
        "Click Save Changes. Your tracker is now active across your entire site.",
    ],
  },
  bigcommerce: {
    title: "BigCommerce Installation Guide",
    steps: [
      "From your BigCommerce control panel, go to Storefront > Script Manager.",
      "Click 'Create a Script'.",
      "Give the script a name, like 'CortexCart Analytics'.",
      "For 'Location on page', select 'Head'.",
      "For 'Select pages where script will be added', choose 'All pages'.",
      "For 'Script type', select 'Script'.",
      "Paste your CortexCart tracker snippet into the 'Script contents' box.",
      "Click Save. The script is now live."
    ],
  },
  magento: {
    title: "Magento Installation Guide",
    steps: [
        "Log in to your Magento Admin panel.",
        "Navigate to Content > Design > Configuration.",
        "Find the store view you want to configure and click Edit.",
        "Under the HTML Head section, find the 'Scripts and Style Sheets' text box.",
        "Paste your CortexCart tracker snippet at the end of this box.",
        "Click Save Configuration. Clear the Magento cache if necessary.",
    ],
  },
  squarespace: {
    title: "Squarespace Installation Guide",
    steps: [
        "In the Home Menu, click Settings, then click Advanced.",
        "Click Code Injection.",
        "Paste your CortexCart tracker snippet into the 'Header' text box.",
        "After adding your code, click Save. This script will now appear on every page of your site."
    ],
  },
  wix: {
    title: "Wix eCommerce Installation Guide",
    steps: [
        "Go to your site's dashboard.",
        "Click Settings, then scroll down to the Advanced section and click Custom Code.",
        "Click '+ Add Custom Code' in the 'Head' section.",
        "Paste your CortexCart tracker snippet into the code box.",
        "Give your code a name (e.g., 'CortexCart Tracker').",
        "Under 'Add Code to Pages', select 'All pages' and 'Load code once'.",
        "Under 'Place Code in', select 'Head'.",
        "Click Apply. The code is now active."
    ],
  },
  prestashop: {
    title: "PrestaShop Installation Guide",
    steps: [
        "This usually requires a module to add custom JavaScript to the theme header.",
        "From your PrestaShop back office, go to 'Module Manager'.",
        "Search for a module that allows adding tracking code (e.g., an 'HTML block' or 'custom JS' module).",
        "Install and configure the module, pasting your CortexCart tracker snippet into the header section.",
        "Alternatively, for advanced users, you can edit your theme's `head.tpl` file directly at `/themes/your-theme/templates/_partials/head.tpl`."
    ],
  },
  opencart: {
    title: "OpenCart Installation Guide",
    steps: [
        "Log in to your OpenCart admin panel.",
        "Navigate to Extensions > Extensions, and choose 'Analytics' from the dropdown.",
        "Look for the 'Google Analytics' extension (even if you don't use GA, it provides a good place to add code). Click Edit.",
        "Paste your CortexCart tracker snippet into the 'Google Analytics Code' box.",
        "Select 'Enabled' as the status and click Save.",
        "If this doesn't work, you may need to edit your theme's header file directly at `catalog/view/theme/your-theme/template/common/header.twig`."
    ],
  },
  custom: {
    title: "Custom HTML Site Installation",
    steps: [
        "This guide is for any standard HTML-based website.",
        "Open the HTML file for each page of your website where you want to track analytics.",
        "Find the closing `</head>` tag. This is usually near the top of the file.",
        "Paste your CortexCart tracker snippet on a new line, just before the closing `</head>` tag.",
        "Save the file and upload it to your web server.",
        "Repeat this process for every page on your site to ensure complete tracking."
    ],
  },
};


export default function PlatformGuidePage() {
    const { status } = useSession();
    const router = useRouter();
    const params = useParams();
    const platform = params.platform;

    const [guide, setGuide] = useState(null);
    const [snippet, setSnippet] = useState('');
    const { data: session } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/'); }
        if (platform && instructions[platform]) {
            setGuide(instructions[platform]);
        }
        if(session?.user?.email) {
            const trackerSnippet = `<!-- CortexCart Tracker -->\n<script async defer>/* ... full snippet code ... */</script>`;
            setSnippet(trackerSnippet);
        }
    }, [status, router, platform, session]);

    if (status === 'loading') {
        return <Layout><p className="p-6">Loading Guide...</p></Layout>;
    }
    
    if (!guide) {
        return <Layout><p className="p-6">Installation guide not found.</p></Layout>;
    }

    return (
        <Layout>
            <div className="mb-8">
                <Link href="/install" className="text-sm text-blue-600 hover:underline">&larr; Back to all platforms</Link>
                <h2 className="text-3xl font-bold mt-2">{guide.title}</h2>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl">
                <h3 className="text-lg font-semibold text-gray-900">Follow these steps:</h3>
                <ol className="mt-4 list-decimal list-inside space-y-4 text-gray-700">
                    {guide.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                    ))}
                </ol>
                <div className="mt-8 pt-6 border-t">
                    <h4 className="font-semibold text-gray-800">Your Code Snippet</h4>
                    <p className="text-sm text-gray-500 mt-1">This is the code you will be pasting.</p>
                    <div className="mt-2 p-4 bg-gray-900 rounded-md text-white font-mono text-xs overflow-x-auto">
                        <pre><code>{snippet}</code></pre>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
