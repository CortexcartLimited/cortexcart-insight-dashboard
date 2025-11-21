// src/lib/userSubscription.js
import { db } from '@/lib/db';

/**
 * Fetches the relevant subscription details for a user from the sites table.
 * @param {string} userEmail - The email of the user.
 * @returns {Promise<{ stripePriceId: string | null, stripeSubscriptionStatus: string | null } | null>}
 */
export async function getUserSubscription(userEmail) {
  if (!userEmail) {
    return null;
  }

  try {
    // Use db.query directly. It handles connection pooling automatically.
    // This is much more stable in Next.js Middleware.
    const [rows] = await db.query(
      'SELECT stripe_price_id, subscription_status FROM sites WHERE user_email = ? LIMIT 1',
      [userEmail]
    );

    if (rows.length > 0) {
      return {
        stripePriceId: rows[0].stripe_price_id,
        stripeSubscriptionStatus: rows[0].subscription_status,
      };
    }
    
    console.log(`getUserSubscription: No user found for email ${userEmail}`);
    return null; 

  } catch (error) {
    console.error('Error fetching user subscription from DB:', error);
    return null;
  }
}