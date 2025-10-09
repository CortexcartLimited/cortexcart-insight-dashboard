import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Use a switch statement to handle different event types
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            try {
                await db.query(
                    `UPDATE sites SET subscription_id = ?, subscription_status = 'trialing' WHERE user_email = ?`,
                    [session.subscription, session.customer_email]
                );
                console.log(`Successfully started trial for ${session.customer_email}`);
            } catch (dbError) {
                console.error('Database error starting trial:', dbError);
            }
            break;
        }
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            try {
                // Update the user's subscription status to 'active'
                await db.query(
                    `UPDATE sites SET subscription_status = 'active' WHERE subscription_id = ?`,
                    [invoice.subscription]
                );
                // Record the successful payment in our new table
                await db.query(
                    'INSERT INTO payment_history (user_email, stripe_invoice_id, amount_paid, currency, status, created_at) VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(?))',
                    [invoice.customer_email, invoice.id, invoice.amount_paid, invoice.currency, 'succeeded', invoice.created]
                );
                console.log(`Successful payment recorded for ${invoice.customer_email}`);
            } catch (dbError) {
                console.error('Database error on payment_succeeded:', dbError);
            }
            break;
        }
        case 'invoice.payment_failed': {
            const invoice = event.data.object;
             try {
                // Optionally update user status on failure
                await db.query(
                    `UPDATE sites SET subscription_status = 'past_due' WHERE subscription_id = ?`,
                    [invoice.subscription]
                );
                // Record the failed payment attempt
                await db.query(
                    'INSERT INTO payment_history (user_email, stripe_invoice_id, amount_paid, currency, status, created_at) VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(?))',
                    [invoice.customer_email, invoice.id, invoice.amount_paid, invoice.currency, 'failed', invoice.created]
                );
                console.log(`Failed payment recorded for ${invoice.customer_email}`);
            } catch (dbError) {
                console.error('Database error on payment_failed:', dbError);
            }
            break;
        }
        // You can add more cases here for other events like 'customer.subscription.deleted'
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
