import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { getPlanDetails } from '@/lib/plans'; // <-- IMPT: Import this!

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

  // Get the Stripe Customer ID common to most subscription events
  const stripeCustomerId = event.data.object.customer;

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Important: Check if it's a 'subscription' mode checkout session
      if (session.mode === 'subscription') {
        const customerEmail = session.customer_details?.email;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (!customerEmail || !customerId || !subscriptionId) {
          console.error('Webhook Error: Missing customer, email, or subscription ID in checkout.session.completed.');
          break;
        }

        try {
          // *** Fetch the subscription to get the price ID ***
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;

          if (!priceId) {
            console.error(`Webhook Error: Could not find price ID on subscription ${subscriptionId}.`);
            break; 
          }

          // *** NEW: Get Token Limits ***
          const plan = getPlanDetails(priceId);
          const tokenLimit = plan.limits.geminiTokens || 100000;

          // *** Update DB Query ***
          await db.query(
            `UPDATE sites SET 
              subscription_status = 'active', 
              stripe_customer_id = ?, 
              stripe_subscription_id = ?, 
              stripe_price_id = ?,
              gemini_token_limit = ? 
             WHERE user_email = ?`,
            [customerId, subscriptionId, priceId, tokenLimit, customerEmail]
          );
          console.log(`✅ Subscription active for ${customerEmail}. Plan: ${plan.name}, Limit: ${tokenLimit}`);

        } catch (error) {
           console.error('Error activating subscription:', error);
        }
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object;
      const updatedStatus = subscriptionUpdated.status;
      const updatedCustomerId = subscriptionUpdated.customer;

      // *** Get the Price ID from the updated subscription ***
      const updatedPriceId = subscriptionUpdated.items.data[0]?.price.id;

      if (!updatedCustomerId) {
         console.error(`Webhook Error: Missing customer ID on subscription.updated.`);
         break;
      }

      try {
        if (updatedPriceId) {
            // If price ID changed (upgrade/downgrade), update limit
            const plan = getPlanDetails(updatedPriceId);
            const tokenLimit = plan.limits.geminiTokens || 100000;

            await db.query(
                `UPDATE sites SET 
                    subscription_status = ?, 
                    stripe_price_id = ?, 
                    gemini_token_limit = ? 
                 WHERE stripe_customer_id = ?`,
                [updatedStatus, updatedPriceId, tokenLimit, updatedCustomerId]
            );
            console.log(`✅ Subscription updated for ${updatedCustomerId}. New Limit: ${tokenLimit}`);
        } else {
            // Just a status update (e.g. payment failure recovery)
            await db.query(
                `UPDATE sites SET subscription_status = ? WHERE stripe_customer_id = ?`,
                [updatedStatus, updatedCustomerId]
            );
            console.log(`✅ Subscription status updated to ${updatedStatus} for ${updatedCustomerId}`);
        }
      } catch (dbError) {
        console.error('Database error updating subscription:', dbError);
      }
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object;
      const deletedCustomerId = subscriptionDeleted.customer;

       if (!deletedCustomerId) {
         console.error(`Webhook Error: Missing customer ID on subscription.deleted.`);
         break;
      }

      try {
        // Reset status and clear limits
        await db.query(
          `UPDATE sites SET 
            subscription_status = 'canceled', 
            stripe_subscription_id = NULL, 
            stripe_price_id = NULL,
            gemini_token_limit = 0 
           WHERE stripe_customer_id = ?`,
          [deletedCustomerId]
        );
        console.log(`✅ Subscription canceled for ${deletedCustomerId}.`);
      } catch (dbError) {
        console.error('Database error handling subscription deletion:', dbError);
      }
      break;

    // --- Optional: Handle Payment Failures ---
    case 'invoice.payment_failed':
        const invoiceFailed = event.data.object;
        console.log(`⚠️ Invoice payment failed for customer ${invoiceFailed.customer}.`);
        break;

     case 'invoice.paid':
        const invoicePaid = event.data.object;
        console.log(`✅ Invoice paid for customer ${invoicePaid.customer}.`);
        break;

    default:
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  return new Response(null, { status: 200 });
}