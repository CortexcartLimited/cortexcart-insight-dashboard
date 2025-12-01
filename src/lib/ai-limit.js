import { db } from '@/lib/db';

// 1. Check if user has tokens remaining
export async function checkAiLimit(email) {
  try {
    const [rows] = await db.query(
      'SELECT gemini_tokens_used, gemini_token_limit FROM sites WHERE user_email = ?',
      [email]
    );

    if (rows.length === 0) return { allowed: false, error: "User not found" };

    const { gemini_tokens_used, gemini_token_limit } = rows[0];

    // Allow a small buffer or strict cutoff? Strict for now.
    if (gemini_tokens_used >= gemini_token_limit) {
      return { allowed: false, error: "Token limit reached. Please upgrade your plan." };
    }

    return { allowed: true };
  } catch (error) {
    console.error("AI Limit Check Error:", error);
    return { allowed: false, error: "System error checking limits." };
  }
}

// 2. Charge tokens (Input + Output)
export async function chargeAiTokens(email, tokens) {
  try {
    await db.query(
      'UPDATE sites SET gemini_tokens_used = gemini_tokens_used + ? WHERE user_email = ?',
      [tokens, email]
    );
  } catch (error) {
    console.error("AI Charge Error:", error);
  }
}

// 3. Estimate tokens (Roughly 4 chars = 1 token)
export function estimateTokens(text) {
    if (!text) return 0;
    // If text is an object (JSON), stringify it first
    const content = typeof text === 'string' ? text : JSON.stringify(text);
    return Math.ceil(content.length / 4);
}