// src/app/api/billing/my-plan/route.js
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
      'SELECT stripe_customer_id, subscription_status FROM sites WHERE user_email = ?',
      [session.user.email]
    );

    if (userRows.length === 0 || !userRows[0].stripe_customer_id) {
      return NextResponse.json({ message: 'No subscription found for this user.' }, { status: 404 });
    }
    const stripeCustomerId = userRows[0].stripe_customer_id;
    const dbStatus = userRows[0].subscription_status;

    // 2. Use the Stripe API to retrieve the subscription details
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 1, // Usually a customer has only one active subscription
    });

    if (subscriptions.data.length === 0) {
      // If Stripe has no subscription, but our DB says it does, sync it.
      if (dbStatus === 'active') {
        await db.query(`UPDATE sites SET subscription_status = 'inactive' WHERE stripe_customer_id = ?`, [stripeCustomerId]);
      }
      return NextResponse.json({ message: 'No subscription found on Stripe.' }, { status: 404 });
    }

    const sub = subscriptions.data[0];
    const plan = sub.items.data[0].price;

    // 3. Format the data to send to the frontend
    const planDetails = {
      status: sub.status, // e.g., 'active', 'trialing', 'past_due'
      current_period_end: new Date(sub.current_period_end * 1000).toLocaleDateString(),
      plan_name: plan.nickname || 'N/A', // The name of the plan, e.g., "Pro Plan"
      price: `${(plan.unit_amount / 100).toFixed(2)} ${plan.currency.toUpperCase()}`,
      interval: plan.recurring.interval, // e.g., 'month', 'year'
    };

    return NextResponse.json(planDetails, { status: 200 });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}