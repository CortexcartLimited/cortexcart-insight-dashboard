// src/app/api/billing/my-plan/route.js
export const dynamic = 'force-dynamic';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPlanDetails } from '@/lib/plans'; 

export const runtime = 'nodejs';

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

    if (userRows.length === 0) {
      // <-- NEW LOGGING 1
      console.log(`MY-PLAN-API: No user found in DB for email: ${session.user.email}`); 
      const defaultPlan = getPlanDetails(null);
      return NextResponse.json(defaultPlan, { status: 200 });
    }

    const stripeCustomerId = userRows[0].stripe_customer_id;
    const dbStatus = userRows[0].subscription_status;

    // If user has no customer ID, they have no plan. Return default.
    if (!stripeCustomerId) {
      // <-- NEW LOGGING 2
      console.log(`MY-PLAN-API: User ${session.user.email} found, but no stripe_customer_id.`);
      const defaultPlan = getPlanDetails(null);
      return NextResponse.json(defaultPlan, { status: 200 });
    }

    // 2. Use the Stripe API to retrieve the subscription details
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all', // Get active, trialing, past_due, etc.
      limit: 1, 
    });

    // Filter for only active or trialing subscriptions
    const activeSubscription = subscriptions.data.find(
      (sub) => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription) {
      // If no active/trialing sub, but our DB says 'active', sync it.
      if (dbStatus === 'active') {
        await db.query(`UPDATE sites SET subscription_status = 'inactive' WHERE stripe_customer_id = ?`, [stripeCustomerId]);
      }
      
      // <-- NEW LOGGING 3
      console.log(`MY-PLAN-API: Stripe customer ${stripeCustomerId} found, but no 'active' or 'trialing' subscription.`);
      const defaultPlan = getPlanDetails(null);
      return NextResponse.json(defaultPlan, { status: 200 });
    }

    const sub = activeSubscription; 

    const price = sub.items.data[0].price; 
    const stripePriceId = price.id; 
    // --- NEW DEBUG LOGS ---
    console.log("--- BILLING API DEBUG ---");
    console.log("User Email:", session.user.email);
    console.log("Stripe sent Price ID:", stripePriceId);
    // ----------------------

    // 3. Get internal plan details from plans.js
    const internalPlan = getPlanDetails(stripePriceId);

    // 4. Format the *combined* data to send to the frontend
    const planDetails = {
      ...internalPlan, 
      status: sub.status, 
      stripePriceId: stripePriceId, 
      current_period_end: new Date(sub.current_period_end * 1000).toLocaleDateString(),
      price: `${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`,
      interval: price.recurring.interval, 
    };

    // <-- NEW LOGGING 4 (Success!)
    console.log(`MY-PLAN-API: Successfully found plan '${planDetails.name}' for ${session.user.email}`);
    return NextResponse.json(planDetails, { status: 200 });

  } catch (error) {
    // This will catch the 'ReferenceError' if it's still there
    console.error('Error fetching subscription details:', error); 
    const defaultPlan = getPlanDetails(null);
    return NextResponse.json(defaultPlan, { status: 200 });
  }
}