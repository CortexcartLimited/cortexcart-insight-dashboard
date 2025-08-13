import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { priceId } = await request.json(); // e.g., 'price_1P...' from your database
        if (!priceId) {
            return NextResponse.json({ message: 'Price ID is required' }, { status: 400 });
        }

        const userEmail = session.user.email;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Create a Stripe Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: userEmail,
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            subscription_data: {
                trial_period_days: 14, // The 14-day free trial
            },
            success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/subscribe`,
        });

        return NextResponse.json({ url: checkoutSession.url }, { status: 200 });

    } catch (error) {
        console.error('Stripe session creation error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
