import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {db} from "@/lib/db";
import { NextResponse } from "next/server";
import { getPlanFromPriceId } from "@/lib/plans";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [userRows] = await db.query(
            'SELECT stripeSubscriptionId, stripePriceId, stripeCurrentPeriodEnd FROM users WHERE email = ? LIMIT 1',
            [session.user.email]
        );
        const user = userRows[0];

        // If the user has no subscription/price ID, they are on the default Beta plan
        if (!user || !user.stripeSubscriptionId) {
            return NextResponse.json({
                planName: 'Beta',
                status: 'Active',
                renewalDate: null,
            });
        }

        // For paying users, get the latest details directly from Stripe
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        const planName = getPlanFromPriceId(user.stripePriceId);
        const renewalDate = new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        
        // The subscription status is "Canceled" if it's set not to renew, otherwise it's "Active".
        const status = subscription.cancel_at_period_end ? 'Canceled' : 'Active';

        return NextResponse.json({ planName, status, renewalDate });

    } catch (error) {
        console.error('Error fetching plan details:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}