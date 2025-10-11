// src/app/api/stripe/webhook/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Get the Stripe Customer ID from the event object
  const stripeCustomerId = event.data.object.customer;

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const customerEmail = session.customer_details.email;

      if (!customerEmail || !stripeCustomerId) {
        console.error('Webhook Error: Missing customer details in checkout.session.completed.');
        break;
      }
      
      try {
        await db.query(
          `UPDATE sites SET subscription_status = 'active', stripe_customer_id = ? WHERE user_email = ?`,
          [stripeCustomerId, customerEmail]
        );
        console.log(`✅ Subscription for ${customerEmail} is now active.`);
      } catch (dbError) {
        console.error('Database error activating subscription:', dbError);
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object;
      const newStatus = subscriptionUpdated.status; // e.g., 'active', 'past_due', 'canceled'
      
      try {
        await db.query(
          `UPDATE sites SET subscription_status = ? WHERE stripe_customer_id = ?`,
          [newStatus, stripeCustomerId]
        );
        console.log(`✅ Subscription for customer ${stripeCustomerId} updated to ${newStatus}.`);
      } catch (dbError) {
        console.error('Database error updating subscription status:', dbError);
      }
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object;
      
      try {
        await db.query(
          `UPDATE sites SET subscription_status = 'canceled' WHERE stripe_customer_id = ?`,
          [stripeCustomerId]
        );
        console.log(`✅ Subscription for customer ${stripeCustomerId} has been canceled.`);
      } catch (dbError) {
        console.error('Database error canceling subscription:', dbError);
      }
      break;

    default:
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response(null, { status: 200 });
}