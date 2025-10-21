// src/lib/userSubscription.js
import { db } from '@/lib/db'; // Your MySQL connection pool

/**
 * Fetches the relevant subscription details for a user from the sites table.
 * @param {string} userEmail - The email of the user.
 * @returns {Promise<{ stripePriceId: string | null, stripeSubscriptionStatus: string | null } | null>}
 */
export async function getUserSubscription(userEmail) {
  if (!userEmail) {
    return null;
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(
      // Adjust column names if they are different in your schema.prisma
      'SELECT stripe_price_id, subscription_status FROM sites WHERE user_email = ? LIMIT 1',
      [userEmail]
    );

    if (rows.length > 0) {
      // Rename DB columns to match what the middleware expects
      return {
        stripePriceId: rows[0].stripe_price_id,
        stripeSubscriptionStatus: rows[0].subscription_status,
      };
    }
    return null; // User found, but no site/subscription info? Or user not found.
  } catch (error) {
    console.error('Error fetching user subscription from DB:', error);
    // Depending on your error handling strategy, you might want to throw, return null, or return a default object.
    // Returning null here will likely lead to the user being treated as having the default plan in middleware.
    return null;
  } finally {
    if (connection) connection.release();
  }
}

// Add functions for usage tracking here later if needed, e.g.:
// export async function getUserUsage(userEmail) { ... }
// export async function incrementSocialPostUsage(userEmail) { ... }
// export async function resetUsageCycle(userEmail, cycleStart, cycleEnd) { ... }