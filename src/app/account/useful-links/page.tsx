// src/app/account/useful-links/page.jsx
import React from 'react';
import UsefulLinkCard from '@/app/components/UsefulLinkCard';
import Layout from '@/app/components/Layout';
// You can easily add or remove services by editing this array.
// Remember to replace '#' with your actual affiliate links.
const usefulLinksData = [
  {
    title: 'Shopify',
    description: 'The all-in-one commerce platform to start, run, and grow a business. Perfect for e-commerce stores of any size.',
    imageUrl: '//a.impactradius-go.com/display-ad/13624-2171837', // This image is already in your project
    affiliateLink: 'https://shopify.pxf.io/c/6589611/2171835/13624',
    rel: 'sponsored',
    target: '_top',
    id: '2171835',  
    width: '188',
    height: '75',
    border: '0',
    alt: '',
  },
  {
    title: 'Tide Business Account',
    description: 'A modern, mobile-first business bank account. Free to open, with powerful features to manage your finances.',
    imageUrl: '/logos/pngaaa.com-2690679.png',
    affiliateLink: 'https://tide.com',
  },
  {
    title: 'QuickFile',
    description: 'Cloud accounting software for UK-based sole traders, contractors, and small businesses. MTD-compliant.',
    imageUrl: 'https://cdn.quickfile.co.uk/images/home/quickfile-logo.svg', // Example external image
    affiliateLink: 'https://www.quickfile.co.uk/?referrer=ekp9879f',
  },
  {
    title: 'Mailchimp',
    description: 'Grow your business with Mailchimp\'s All-In-One marketing, automation & email marketing platform.',
    imageUrl: '/logos/mailchimplogo.png', // This image is already in your project
    affiliateLink: 'https://mailchimp.com',
  },
    {
    title: 'QuickBooks',
    description: 'The world’s #1 online accounting software for small businesses. Manage invoices, expenses, and more. Cortexcart users Get 30% off a new QuickBooks Online or QuickBooks Online Payroll subscriptions for 6 months',
    imageUrl: '/logos/quickbooklogo.png', // This image is already in your project
    affiliateLink: 'https://quickbooks.com',
  },
   {
    title: 'Anna',
    description: 'ANNA is a business account and tax app for small businesses. Customers get a business account, debit cards and all the software they need to grow their businesses, from invoicing and expenses to VAT calculation.',
    imageUrl: 'https://anna.money//static/img/svg/anna_logo.svg', // This image is already in your project
    affiliateLink: 'https://anna.money/',
  },
  // Add more partner services here...
];

const UsefulLinksPage = () => {
  return (
    <Layout>
    <div className='mb-8'>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Useful Links & Partners</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Discover tools and services we recommend to help you grow your business.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {usefulLinksData.map((link, index) => (
          <UsefulLinkCard
            key={index}
            title={link.title}
            description={link.description}
            imageUrl={link.imageUrl}
            affiliateLink={link.affiliateLink}
          />
        ))}
      </div>
    </div>
             <small className='text-center mt-2 mb-2 text-gray-600 dark:text-gray-400'>*For your information: We may receive a commission for any services that you sign up for on this page..</small>

    </Layout>
  );
};

export default UsefulLinksPage;