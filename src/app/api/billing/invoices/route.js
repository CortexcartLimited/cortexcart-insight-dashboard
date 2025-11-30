// src/app/api/billing/invoices/route.js
export const dynamic = 'force-dynamic';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // 1. Get the user's Stripe Customer ID from your database
    const [userRows] = await db.query(
      'SELECT stripe_customer_id FROM sites WHERE user_email = ?',
      [session.user.email]
    );

    if (userRows.length === 0 || !userRows[0].stripe_customer_id) {
      return NextResponse.json({ message: 'Stripe customer not found.' }, { status: 404 });
    }
    const stripeCustomerId = userRows[0].stripe_customer_id;

    // 2. Use the Stripe API to list all invoices for this customer
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 100, // You can adjust the limit or implement pagination if needed
    });

    // 3. Format the data to send to the frontend
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000).toLocaleDateString(),
      status: invoice.status,
      total: `${(invoice.total / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`,
      invoice_pdf: invoice.invoice_pdf, // Link to the PDF
      hosted_invoice_url: invoice.hosted_invoice_url, // Link to the hosted invoice page
    }));

    return NextResponse.json(formattedInvoices, { status: 200 });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}