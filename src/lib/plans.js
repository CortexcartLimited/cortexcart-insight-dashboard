// src/lib/plans.js

/**
 * This object defines the internal names for your plans.
 */
export const PLANS = {
  BETA: 'Beta',
  STARTER: 'Starter',
  GROWTH: 'Growth',
  BUSINESS: 'Business',
};

/**
 * This mapping connects the Stripe Price ID (from your Stripe dashboard) 
 * to the internal plan names defined above.
 * * EXAMPLE IDs - REPLACE THESE WITH YOUR ACTUAL STRIPE PRICE IDs
 */
const STRIPE_PRICE_ID_TO_PLAN = {
  'price_1P...starter_monthly': PLANS.STARTER,
  'price_1P...starter_yearly': PLANS.STARTER,
  'price_1P...growth_monthly': PLANS.GROWTH,
  'price_1P...growth_yearly': PLANS.GROWTH,
  'price_1P...business_monthly': PLANS.BUSINESS,
};

/**
 * A helper function to get the plan name from a user's Stripe Price ID.
 * @param {string | null} priceId The stripePriceId from the user's record in your database.
 * @returns {string} The name of the plan.
 */
export function getPlanFromPriceId(priceId) {
  // If the user has no priceId, they are on the default free/beta plan.
  if (!priceId) {
    return PLANS.BETA;
  }
  
  return STRIPE_PRICE_ID_TO_PLAN[priceId] || 'Unknown Plan';
}