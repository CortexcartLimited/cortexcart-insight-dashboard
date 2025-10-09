// src/lib/session.js

// This object defines the configuration for your iron-session.
export const sessionOptions = {
  // The password must be a private string of at least 32 characters.
  // It's used to encrypt the session data.
  // We will store this in our environment variables for security.
  password: process.env.SESSION_PASSWORD,
  cookieName: 'cortex-session', // You can name your cookie anything
  cookieOptions: {
    // The 'secure' option should be true in production to ensure
    // the cookie is only sent over HTTPS.
    secure: process.env.NODE_ENV === 'production',
    // httpOnly: true, // Recommended to prevent client-side script access
    // sameSite: 'lax', // Helps mitigate CSRF attacks
  },
};