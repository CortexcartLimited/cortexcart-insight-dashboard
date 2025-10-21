// src/app/api/stripe/webhook/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db'; //

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
  // Note: For checkout.session.completed, it's directly on the session object
  const stripeCustomerId = event.data.object.customer;

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Important: Check if it's a 'subscription' mode checkout session
      if (session.mode === 'subscription') {
        const customerEmail = session.customer_details?.email; // Get email
        const subscriptionId = session.subscription; // Get the subscription ID
        const customerId = session.customer; // Get the customer ID

        if (!customerEmail || !customerId || !subscriptionId) {
          console.error('Webhook Error: Missing customer, email, or subscription ID in checkout.session.completed for subscription.');
          break; // Don't proceed without essential IDs
        }

        try {
          // *** Fetch the subscription to get the price ID ***
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          // Assuming the subscription has at least one item and we care about the first one's price
          const priceId = subscription.items.data[0]?.price.id;

          if (!priceId) {
            console.error(`Webhook Error: Could not find price ID on subscription ${subscriptionId} from checkout session ${session.id}.`);
            break; // Don't proceed without price ID
          }

          // *** Update DB Query ***
          await db.query(
            `UPDATE sites SET 
              subscription_status = 'active', 
              stripe_customer_id = ?, 
              stripe_subscription_id = ?, 
              stripe_price_id = ? 
             WHERE user_email = ?`,
            [customerId, subscriptionId, priceId, customerEmail] // Added subscriptionId and priceId
          );
          console.log(`✅ Subscription ${subscriptionId} for ${customerEmail} (Customer: ${customerId}) is now active with Price ID ${priceId}.`);

        } catch (error) {
           if (error instanceof Stripe.errors.StripeError) {
             console.error('Stripe API error fetching subscription:', error.message);
           } else {
             console.error('Database error activating subscription:', error);
           }
        }
      } else {
         console.log(`Webhook: Ignoring checkout.session.completed in mode '${session.mode}'.`);
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object;
      const updatedStatus = subscriptionUpdated.status; // e.g., 'active', 'past_due', 'canceled', 'trialing'
      const updatedCustomerId = subscriptionUpdated.customer; // Customer ID is on the subscription obj

      // *** Get the Price ID from the updated subscription ***
      // Assuming the first item's price is the relevant one
      const updatedPriceId = subscriptionUpdated.items.data[0]?.price.id;

      if (!updatedCustomerId) {
         console.error(`Webhook Error: Missing customer ID on customer.subscription.updated event for subscription ${subscriptionUpdated.id}.`);
         break;
      }
      if (!updatedPriceId) {
          console.error(`Webhook Error: Could not find price ID on updated subscription ${subscriptionUpdated.id}.`);
          // Decide if you still want to update the status or break.
          // Let's update status only for now, but log the missing price ID.
      }

      try {
        // *** Update DB Query ***
        // Only update price ID if we found one
        const sql = updatedPriceId
          ? `UPDATE sites SET subscription_status = ?, stripe_price_id = ? WHERE stripe_customer_id = ?`
          : `UPDATE sites SET subscription_status = ? WHERE stripe_customer_id = ?`;

        const params = updatedPriceId
          ? [updatedStatus, updatedPriceId, updatedCustomerId]
          : [updatedStatus, updatedCustomerId];

        await db.query(sql, params);

        if (updatedPriceId) {
          console.log(`✅ Subscription for customer ${updatedCustomerId} updated to ${updatedStatus} with Price ID ${updatedPriceId}.`);
        } else {
           console.log(`✅ Subscription status for customer ${updatedCustomerId} updated to ${updatedStatus}. (Price ID not found/updated)`);
        }
      } catch (dbError) {
        console.error('Database error updating subscription:', dbError);
      }
      break;

    case 'customer.subscription.deleted': // Typically means canceled immediately or at period end fully removed
      const subscriptionDeleted = event.data.object;
      const deletedCustomerId = subscriptionDeleted.customer;

       if (!deletedCustomerId) {
         console.error(`Webhook Error: Missing customer ID on customer.subscription.deleted event for subscription ${subscriptionDeleted.id}.`);
         break;
      }

      try {
        // *** Update DB Query ***
        // Set status to canceled and clear subscription/price IDs
        await db.query(
          `UPDATE sites SET 
            subscription_status = 'canceled', 
            stripe_subscription_id = NULL, 
            stripe_price_id = NULL 
           WHERE stripe_customer_id = ?`,
          [deletedCustomerId]
        );
        console.log(`✅ Subscription for customer ${deletedCustomerId} has been marked canceled and IDs cleared.`);
      } catch (dbError) {
        console.error('Database error handling subscription deletion:', dbError);
      }
      break;

     // --- Optional: Handle Trial End ---
     case 'customer.subscription.trial_will_end':
       // This event fires ~3 days before a trial ends.
       // You could use it to notify the user.
       console.log(`🔔 Subscription trial ending soon for customer ${stripeCustomerId}.`);
       // No DB update needed here usually, status remains 'trialing' until payment or expiry.
       break;

    // --- Optional: Handle Payment Failures ---
    case 'invoice.payment_failed':
        const invoiceFailed = event.data.object;
        const failedCustomerId = invoiceFailed.customer;
        // The subscription status might automatically become 'past_due' or 'unpaid'
        // You might want to update your status based on this or just rely on subscription.updated event.
        // You could also trigger notifications to the user here.
        if (invoiceFailed.billing_reason === 'subscription_cycle' || invoiceFailed.billing_reason === 'subscription_update') {
            console.log(`⚠️ Invoice payment failed for customer ${failedCustomerId}. Subscription status might change.`);
             // Optionally update status to 'past_due' immediately if subscription.updated is slow
             // await db.query(
             //   `UPDATE sites SET subscription_status = 'past_due' WHERE stripe_customer_id = ? AND subscription_status = 'active'`,
             //   [failedCustomerId]
             // );
        }
        break;

     // --- Optional: Handle Successful Payments (Confirming 'active' status) ---
     case 'invoice.paid':
        const invoicePaid = event.data.object;
        const paidCustomerId = invoicePaid.customer;
         // Usually, a 'customer.subscription.updated' event follows this with status 'active'.
         // However, you could use this event to reset usage counters if you implement usage tracking.
        if (invoicePaid.billing_reason === 'subscription_cycle' || invoicePaid.billing_reason === 'subscription_update') {
            console.log(`✅ Invoice paid for customer ${paidCustomerId}. Subscription should be/become active.`);
            // If you track usage: Reset usage counters here based on paidCustomerId
            // await resetUsageCycle(paidCustomerId, newCycleStart, newCycleEnd);
        }
        break;


    default:
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response(null, { status: 200 });
}