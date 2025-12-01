// src/lib/plans.js

// Define Infinity for unlimited features if not already defined
const INFINITY = Number.POSITIVE_INFINITY;

export const PLANS = {
  // --- Free Tier (Example - Add if you have one) ---
  // 'price_free_tier_id': {
  //   id: 'free',
  //   name: 'Free',
  //   stripePriceId: 'price_free_tier_id', // Replace with actual ID
  //   limits: {
  //     visitsPerMonth: 100,
  //     googleAnalytics: false,
  //     recommendationWidgets: true,
  //     maxRecommendedProducts: 5,
  //     supportLevel: 'community', // e.g., 'community', 'basic_email', 'priority_email', 'priority_ticket'
  //     maxSocialConnections: 1,
  //     maxPlatformIntegrations: 0,
  //     abTesting: false,
  //     customRecommendationAlgorithms: 0,
  //     revenueAttributionModels: 0,
  //     customAiFeatures: 0,
  //     // Add other features/limits specific to your app (e.g., heatmaps, reports)
  //     maxHeatmaps: 1,
  //     maxReports: 1,
  //   }
  // },

  // --- Starter Plan ---
  'price_1S6S9hF6XLY4flzwj7GYLs4C': { // <-- Replace with your actual Stripe Price ID
    id: 'starter',
    name: 'Starter',
    stripePriceId: 'price_1S6S9hF6XLY4flzwj7GYLs4C', // <-- Replace with your actual Stripe Price ID
    limits: {
      visitsPerMonth: 1000,
      googleAnalytics: false, // Basic analytics doesn't include Google integration
      recommendationWidgets: 10,
      maxRecommendedProducts: 10,
      supportLevel: 'basic_email',
      maxSocialConnections: 2,
      maxPlatformIntegrations: 1,
      abTesting: false,
      customRecommendationAlgorithms: 0,
      revenueAttributionModels: 0,
      customAiFeatures: 0,
      supportTickets: false, //Only for business users
      // Add other features/limits
      maxHeatmaps: 1, // Example
      maxReports: 5, // Example
      // Add social posts limit if applicable
      // socialPostsPerMonth: 50, // Example!
      geminiTokens: 100000, // 100k tokens
    }
  },
  // Add Starter Annual Price ID if it exists and points to the same limits

  // --- Growth Plan ---
  'price_1S6SAJF6XLY4flzwzQgLGJIq': { // <-- Replace with your actual Stripe Price ID
    id: 'growth',
    name: 'Growth',
    stripePriceId: 'price_1S6SAJF6XLY4flzwzQgLGJIq', // <-- Replace with your actual Stripe Price ID
    limits: {
      visitsPerMonth: 10000,
      googleAnalytics: true, // Advanced includes Google
      recommendationWidgets: true,
      maxRecommendedProducts: 50,
      supportLevel: 'priority_email',
      maxSocialConnections: 3,
      maxPlatformIntegrations: 2,
      abTesting: true,
      customRecommendationAlgorithms: 0,
      revenueAttributionModels: 0,
      customAiFeatures: 0,
      supportTickets: false, //Only for business users
      // Add other features/limits
      maxHeatmaps: 10, // Example
      maxReports: 20, // Example
      // socialPostsPerMonth: 200, // Example
      geminiTokens: 500000, // 500k tokens
    }
  },
  // Add Growth Annual Price ID if it exists and points to the same limits

  // --- Business Plan ---
  'price_1S6SAlF6XLY4flzwpYebeTpK': { // <-- Replace with your actual Stripe Price ID
    id: 'business',
    name: 'Business',
    stripePriceId: 'price_1S6SAlF6XLY4flzwpYebeTpK', // <-- Replace with your actual Stripe Price ID
    limits: {
      visitsPerMonth: 30000,
      googleAnalytics: true,
      recommendationWidgets: true,
      maxRecommendedProducts: INFINITY, // Unlimited
      supportLevel: 'priority_ticket',
      maxSocialConnections: INFINITY, // Unlimited
      maxPlatformIntegrations: INFINITY, // Unlimited
      abTesting: true,
      customRecommendationAlgorithms: 5,
      revenueAttributionModels: 5,
      customAiFeatures: 1, // Base feature, additional might be addons
      supportTickets: true, //Only for business users
      // Add other features/limits
      maxHeatmaps: INFINITY, // Example
      maxReports: INFINITY, // Example
      // socialPostsPerMonth: INFINITY, // Example
      geminiTokens: 1500000, // 1.5m tokens
    }
  },
  // Add Business Annual Price ID if it exists and points to the same limits

  // --- Beta Trial Plan ---
  // Typically, a trial uses the Price ID of the plan being trialed (e.g., Business).
  // Stripe webhooks handle the trial end. So you might not need a separate entry here
  // unless you have a specific "Beta" Price ID in Stripe. If you *do* have a specific Beta Price ID:
  'price_1SVUHmF6XLY4flzwXDNEjczL': { // <-- Replace with your actual Stripe Price ID if it exists
    id: 'beta',
    name: 'Beta',
    stripePriceId: 'price_1SVUHmF6XLY4flzwXDNEjczL', // <-- Replace with your actual Stripe Price ID if it exists
    // Mirror the limits of the plan being trialed (e.g., Business)
    limits: {
      visitsPerMonth: 30000,
      googleAnalytics: true,
      recommendationWidgets: true,
      maxRecommendedProducts: INFINITY,
      supportLevel: 'priority_ticket', // Or maybe specific beta support
      maxSocialConnections: INFINITY,
      maxPlatformIntegrations: INFINITY,
      abTesting: true,
      customRecommendationAlgorithms: 5,
      revenueAttributionModels: 5,
      customAiFeatures: 1,
      maxHeatmaps: INFINITY,
      maxReports: INFINITY,
      supportTickets: true, //Only for business users
      // socialPostsPerMonth: INFINITY,
      geminiTokens: 1500000, // 1.5m tokens
    }
  },
};

/**
 * Helper function to get plan details from a Stripe Price ID.
 * Defaults to a basic/free plan if ID is invalid or not found.
 * @param {string | null | undefined} priceId - The Stripe Price ID.
 * @returns {object} The plan details object including limits.
 */
export function getPlanDetails(priceId) {
  // Find the plan details using the provided priceId
  const foundPlan = PLANS[priceId];

  if (foundPlan) {
    return foundPlan;
  }

  // --- !! IMPORTANT: Define your default/fallback plan !! ---
  // If no priceId matches (e.g., user has no subscription, or unknown ID),
  // return a default plan object (e.g., a free tier or a base restricted plan).
  // Create this 'default_free' entry above if needed.
  return PLANS['default'] || { // Replace 'price_free_tier_id' if you added one
    id: 'price_1S6S9hF6XLY4flzwj7GYLs4C',
    name: 'Default Restricted',
    stripePriceId: null,
     limits: {
      visitsPerMonth: 1000,
      googleAnalytics: false, // Basic analytics doesn't include Google integration
      recommendationWidgets: 10,
      maxRecommendedProducts: 10,
      supportLevel: 'priority_ticket',
      maxSocialConnections: 2,
      maxPlatformIntegrations: 1,
      abTesting: false,
      customRecommendationAlgorithms: 0,
      revenueAttributionModels: 0,
      customAiFeatures: 0,
      // Add other features/limits
      maxHeatmaps: 0, // Example
      maxReports: 5, // Example
      supportTickets: false,
    }
  };
}