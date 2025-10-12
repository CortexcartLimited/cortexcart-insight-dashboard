// src/app/api/debug-env/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  // WARNING: This exposes sensitive keys. Delete this file after debugging.
  const keys = {
    stripeKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    nodeEnv: process.env.NODE_ENV,
  };
  return NextResponse.json(keys);
}