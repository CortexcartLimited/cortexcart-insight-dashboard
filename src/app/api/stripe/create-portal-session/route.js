// src/app/api/stripe/create-portal-session/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account`;

    // 1. Get the user's Stripe Customer ID from your database
    const [userRows] = await db.query(
      'SELECT stripe_customer_id FROM sites WHERE user_email = ?',
      [session.user.email]
    );

    // --- THIS IS THE IMPORTANT FIX ---
    // Check if a user was found and if they have a customer ID.
    if (userRows.length === 0 || !userRows[0].stripe_customer_id) {
      console.error(`Attempted to create portal session for user without a Stripe Customer ID: ${session.user.email}`);
      return NextResponse.json({ message: 'No subscription found for this user. Please subscribe to a plan first.' }, { status: 400 });
    }
    const stripeCustomerId = userRows[0].stripe_customer_id;

    // 2. Create a Portal Session with the Customer ID
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    // 3. Return the unique URL for the portal session
    return NextResponse.json({ url: portalSession.url }, { status: 200 });

  } catch (error) {
    console.error('Error creating Stripe portal session:', error);
    // Send back a generic server error if something else goes wrong
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}