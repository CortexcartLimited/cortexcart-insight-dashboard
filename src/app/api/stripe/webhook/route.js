// app/api/stripe/webhook/route.js
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
    console.error(`❌ Error message: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // This is the email the customer used in the Stripe Checkout form
      const customerEmail = session.customer_details.email;
      const stripeCustomerId = session.customer;

      if (!customerEmail) {
        console.error('Webhook Error: No customer email found in the session.');
        break;
      }
      
      try {
        // Update the user's record in your database
        await db.query(
          `UPDATE sites 
           SET subscription_status = ?, stripe_customer_id = ? 
           WHERE user_email = ?`,
          ['active', stripeCustomerId, customerEmail]
        );
        console.log(`✅ Subscription for ${customerEmail} is now active.`);
      } catch (dbError) {
        console.error('Database error updating subscription:', dbError);
      }

      break;
    
    // You can add more event types here later, like...
    case 'customer.subscription.deleted':
      // Handle a canceled subscription
      break;

    default:
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response(null, { status: 200 });
}