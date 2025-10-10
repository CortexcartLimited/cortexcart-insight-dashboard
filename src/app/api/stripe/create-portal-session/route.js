import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {db} from "@/lib/db";
import { NextResponse } from "next/server";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // 1. Find the user in your database
        const [userRows] = await db.query('SELECT stripe_customer_id FROM sites WHERE email = ? LIMIT 1', [session.user.email]);
        const user = userRows[0];

        if (!user || !user.stripeCustomerId) {
            return NextResponse.json({ message: 'Stripe customer ID not found.' }, { status: 404 });
        }

        // 2. Create a Stripe Billing Portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-settings`,
        });

        // 3. Return the secure URL to the frontend
        return NextResponse.json({ url: portalSession.url });

    } catch (error) {
        console.error('Error creating Stripe portal session:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}