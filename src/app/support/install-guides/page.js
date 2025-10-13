'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/Layout';
import Link from 'next/link';

// Simple SVG components for logos.
const ShopifyLogo = () => ( <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600"><title>Shopify</title><path d="M12.025 21.158c-4.835 0-8.73-3.896-8.73-8.73s3.895-8.73 8.73-8.73c2.59 0 4.92.93 6.645 2.79a.29.29 0 0 1 .035.454l-1.55 1.775a.29.29 0 0 1-.41.034c-1.39-1.2-3.2-1.92-5.1-1.92-3.325 0-6.02 2.7-6.02 6.02s2.695 6.02 6.02 6.02c2.19 0 4.09-.945 5.28-2.45a.29.29 0 0 1 .485-.035l1.62 1.555a.29.29 0 0 1-.035.454c-1.815 2.115-4.5 3.442-7.29 3.442zm4.185-8.86c0-1.89-1.28-3.08-3.02-3.08-1.53 0-2.525.99-2.525 2.17 0 1.515 1.25 2.055 2.51 2.45l.54.175c.57.19.785.45.785.8 0 .52-.51.87-.99.87-.69 0-1.285-.59-1.33-.87a.309.309 0 0 0-.29-.22h-1.87a.309.309 0 0 0-.29.22c.16 1.485 1.345 2.59 3.1 2.59 1.935 0 3.32-.99 3.32-2.885 0-1.635-1.1-2.34-2.585-2.81l-.57-.175c-.51-.17-.855-.39-.855-.78s.345-.7.89-.7c.48 0 .89.28.925.66a.3.3 0 0 0 .285.24h1.79a.3.3 0 0 0 .285-.24c-.03-1.695-1.4-2.625-3-2.625-1.74 0-2.81.99-2.81 2.4 0 .42.12.78.36 1.09h-.01c-.135.165-.24.33-.24.55v.01z"/></svg> );
const MagentoLogo = () => ( <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-600"><title>Magento</title><path d="M12 0l-9 2.5v12l9 7 9-7v-12L12 0zm6.5 4.5l-6.5 4-6.5-4 6.5-2.5 6.5 2.5zM5.5 13.5l-3-2V6l3 2v5.5zm1 1.5l6.5 4v-8l-6.5-4v8zm11-1.5V8l3-2v5.5l-3 2z"/></svg> );
const WooCommerceLogo = () => ( <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600"><title>WooCommerce</title><path d="M4.62 16.345L12 21.75l7.38-5.405-2.903-2.123-4.477 3.28-4.477-3.28-2.903 2.123zM12 2.25L2.25 9l2.25 1.628 7.5-5.517 7.5 5.517L21.75 9 12 2.25zm-6.12 8.122L2.98 8.25l-2.98 2.25 6.12 4.355v-4.355zm12.24 0L24 10.5l-2.982-2.122v4.355z"/></svg> );
const BigCommerceLogo = () => ( <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-700"><title>BigCommerce</title><path d="M16.531 3.425a1.531 1.531 0 00-1.531 1.532v14.086a1.531 1.531 0 001.531 1.531h3.063a1.531 1.531 0 001.531-1.531V4.957a1.531 1.531 0 00-1.531-1.532zm-12 0a1.531 1.531 0 00-1.532 1.532v7.656c0 .847.684 1.531 1.532 1.531h3.062a1.531 1.531 0 001.532-1.531V4.957A1.531 1.531 0 007.593 3.425z"/></svg> );
const OpenCartLogo = () => ( <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500"><title>OpenCart</title><path d="M22.512 8.2a12.024 12.024 0 00-21.024 0H0v2.4h2.52c.984 5.34 5.664 9.4 11.232 9.4h.504c5.568 0 10.248-4.06 11.232-9.4h2.52V8.2zM8.592 12.872c0-.912.744-1.656 1.656-1.656h2.256V8.2H3.312a9.623 9.623 0 015.28-4.26V12.87zM15.408 15.4a1.656 1.656 0 110-3.312h2.256v5.808a9.626 9.626 0 01-5.28 1.968v-4.464z"/></svg> );
const PrestaShopLogo = () => ( <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-pink-600"><title>PrestaShop</title><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25zm-2.018 4.225l-2.012 5.034h4.03l2.01-5.034zm-3.018 6h3.018v3.018H6.964zm4.036 0h6.036v1.012h-6.036zm0-1.988l2.012-5.034h1.012l-2.016 5.034z"/></svg> );
const SquarespaceLogo = () => ( <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black"><title>Squarespace</title><path d="M18.352 2.915a.34.34 0 00-.28-.34H5.8a.34.34 0 00-.339.28L2.518 12l2.942 9.115a.34.34 0 00.34.28h12.274a.34.34 0 00.34-.28L21.482 12zM12 18.432a6.432 6.432 0 110-12.864 6.432 6.432 0 010 12.864z"/></svg> );
const WixLogo = () => ( <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black"><title>Wix</title><path d="M12.985.435h7.247L13.256 12l6.976 11.565h-7.247L9.76 16.733H3.77V23.56H.007V.435h9.815zm-3.225 3.32H3.77v9.89h6.12z"/></svg> );
const CustomHtmlLogo = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg> );

const platforms = [
    { name: 'Shopify', slug: 'shopify', logo: <ShopifyLogo /> },
    { name: 'WooCommerce', slug: 'woocommerce', logo: <WooCommerceLogo /> },
    { name: 'BigCommerce', slug: 'bigcommerce', logo: <BigCommerceLogo /> },
    { name: 'Magento', slug: 'magento', logo: <MagentoLogo /> },
    { name: 'Squarespace', slug: 'squarespace', logo: <SquarespaceLogo /> },
    { name: 'Wix', slug: 'wix', logo: <WixLogo /> },
    { name: 'PrestaShop', slug: 'prestashop', logo: <PrestaShopLogo /> },
    { name: 'OpenCart', slug: 'opencart', logo: <OpenCartLogo /> },
    { name: 'Custom HTML', slug: 'custom', logo: <CustomHtmlLogo /> },
];


export default function InstallGuidePage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/'); }
    }, [status, router]);

    if (status === 'loading') {
        return <Layout><p className="p-6">Loading...</p></Layout>;
    }

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold">Installation Guides</h2>
                <p className="mt-1 text-sm text-gray-500">Select your e-commerce platform to view detailed setup instructions.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {platforms.map(platform => (
                    <Link key={platform.slug} href={`/install/${platform.slug}`}>
                        <div className="flex items-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 cursor-pointer">
                            {platform.logo}
                            <span className="ml-4 text-lg font-semibold text-gray-800">{platform.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </Layout>
    );
}
