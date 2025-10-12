// src/app/billing-invoices/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowDownTrayIcon, ArrowLeftCircle } from '@heroicons/react/24/outline';
import Layout from '@/app/components/Layout';

const StatusBadge = ({ status }) => {
  const styles = {
    paid: 'bg-green-100 text-green-800',
    open: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800',
    void: 'bg-red-100 text-red-800',
    uncollectible: 'bg-red-100 text-red-800',
  };
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>{statusText}</span>;
};

export default function BillingInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/billing/invoices');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to fetch invoices.');
        }
        const data = await response.json();
        setInvoices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <Layout>
    <div className="p-6 sm:p-10">
           
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
       
       
         <div>
        
          <h1 className="text-2xl font-bold text-gray-900">Billing History</h1>
            <p className="flex justify-between items-left mt-1 text-sm text-gray-600">View and download your past invoices.</p>
           
 </div>
           <div className="flex justify-end mt-4">
      <Link href="/billing-settings" className="text-blue-500 hover:text-blue-600 font-bold py-2 px-4 rounded-lg transition duration-300">
          Back to Account Page
        </Link>
    </div>
        
      </div>
      
      {isLoading ? (
        <p>Loading invoices...</p>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Invoice ID</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{invoice.id}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{invoice.date}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><StatusBadge status={invoice.status} /></td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{invoice.total}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 mr-4">
                      View
                    </a>
                    <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-900">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
   
        </div>
      )}
    </div>
 
    </Layout>
  );
}