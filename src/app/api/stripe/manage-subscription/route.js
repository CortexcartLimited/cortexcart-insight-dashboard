import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {db} from "@/lib/db";
import { NextResponse } from "next/server";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET handler to fetch current subscription status
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [userRows] = await db.query('SELECT stripe_subscription_id FROM sites WHERE email = ? LIMIT 1', [session.user.email]);
        const user = userRows[0];

        if (!user || !user.stripeSubscriptionId) {
            return NextResponse.json({ message: 'Subscription not found.' }, { status: 404 });
        }

        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        // If cancel_at_period_end is true, it means auto-payment is OFF.
        // We return the opposite for our "auto-payment enabled" toggle.
        return NextResponse.json({ autoPaymentEnabled: !subscription.cancel_at_period_end });

    } catch (error) {
        console.error('Error fetching subscription status:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST handler to update the subscription
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { autoPaymentEnabled } = await request.json();

        const [userRows] = await db.query('SELECT stripe_subscription_id FROM sites WHERE email = ? LIMIT 1', [session.user.email]);
        const user = userRows[0];
        
        if (!user || !user.stripeSubscriptionId) {
             return NextResponse.json({ message: 'Subscription not found.' }, { status: 404 });
        }

        // Set cancel_at_period_end to the opposite of what the toggle says
        const cancel_at_period_end = !autoPaymentEnabled;

        await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: cancel_at_period_end,
        });

        return NextResponse.json({ message: 'Subscription updated successfully.' });

    } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}