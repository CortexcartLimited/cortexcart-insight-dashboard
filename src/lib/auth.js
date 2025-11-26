// src/lib/auth.js
import GoogleProvider from 'next-auth/providers/google';
import TwitterProvider from 'next-auth/providers/twitter';
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import bcrypt from 'bcryptjs';
import { getUserSubscription } from '@/lib/userSubscription'; // <--- NEW IMPORT

// Automatically determine if we should use secure cookies.
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https");

/** @type {import('next-auth').AuthOptions} */
export const authOptions = {
    pages: {
        signIn: '/login',
    },
    useSecureCookies: useSecureCookies,
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            },
        },
        callbackUrl: {
            name: `${useSecureCookies ? '__Secure-' : ''}next-auth.callback-url`,
            options: {
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            },
        },
        csrfToken: {
            name: `${useSecureCookies ? '__Host-' : ''}next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            },
        },
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                try {
                    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [credentials.email]);
                    if (rows.length === 0) return null;
                    const user = rows[0];

                    // --- NEW SECURITY CHECK ---
                    if (!user.emailVerified) {
                        throw new Error("Please verify your email address first.");
                    }
                    // --------------------------

                    const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);
                    if (!passwordMatch) return null;
                    return { id: user.id, email: user.email, name: user.name };
                } catch (error) {
                    console.error("Credentials auth error:", error);
                    // NextAuth often swallows errors, so returning null is safer, 
                    // but throwing an error allows you to show specific messages if configured.
                    throw new Error(error.message || "Login failed"); 
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: 'openid email profile https://www.googleapis.com/auth/youtube.upload',
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        TwitterProvider({
            id: "x",
            clientId: process.env.X_CLIENT_ID,
            clientSecret: process.env.X_CLIENT_SECRET,
            version: "2.0",
            authorization: {
            params: { 
            scope: "tweet.read tweet.write users.read offline.access" 
        }
      }
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            let { email, name } = user;
            if (account.provider === 'twitter' && !email) {
                email = `${user.id}@users.twitter.com`;
            }
            if (!email) {
                console.error(`Sign-in denied for provider ${account.provider}: email not available.`);
                return false;
            }
            try {
                const [userResult] = await db.query('SELECT * FROM sites WHERE user_email = ?', [email]);
                if (userResult.length === 0) {
                    await db.query('INSERT INTO sites (user_email, site_name) VALUES (?, ?)', [email, `${name}'s Site`]);
                }
            } catch (error) {
                console.error("DB Error during signIn:", error);
                return false; // If DB error occurs, cancel sign-in
            }
            return true; // Allow sign-in
        },
        
        // --- CRITICAL FIX IS HERE ---
        async jwt({ token, user, account }) {
            // 1. Handle Initial Sign In
            if (account && user) {
                token.id = user.id;
                token.email = user.email || `${user.id}@users.twitter.com`;
                token.name = user.name;
                token.picture = user.image;

                if (account.access_token) { 
                    try {
                        // FIX: Added 'is_active' to INSERT and UPDATE
                        const query = `
                            INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, expires_at, is_active)
                            VALUES (?, ?, ?, ?, ?, 1)
                            ON DUPLICATE KEY UPDATE 
                                access_token_encrypted = VALUES(access_token_encrypted), 
                                refresh_token_encrypted = VALUES(refresh_token_encrypted),
                                expires_at = VALUES(expires_at),
                                is_active = 1;
                        `;
                        const expires_at = account.expires_at ? new Date(account.expires_at * 1000) : null;
                        await db.query(query, [token.email, account.provider, encrypt(account.access_token), encrypt(account.refresh_token), expires_at]);
                    } catch (dbError) {
                        console.error("CRITICAL ERROR saving social connection:", dbError);
                    }
                }
            }

            // 2. Fetch Subscription Data and Inject into Token
            // This runs every time the session is checked, keeping the token fresh.
            if (token.email) {
                try {
                    const sub = await getUserSubscription(token.email);
                    // Save these onto the token so Middleware can read them instantly
                    token.stripePriceId = sub?.stripePriceId || null;
                    token.stripeSubscriptionStatus = sub?.stripeSubscriptionStatus || null;
                } catch (error) {
                    console.error("Error fetching subscription for token:", error);
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.image = token.picture;
                // Pass subscription data to the client-side session too (optional but useful)
                session.user.stripePriceId = token.stripePriceId;
            }
            if (session.user?.email) {
                try {
                    const [siteRows] = await db.query('SELECT id, onboarding_completed FROM sites WHERE user_email = ? LIMIT 1', [session.user.email]);
                    if (siteRows.length > 0) {
                        session.user.site_id = siteRows[0].id;
                        session.user.onboarding_completed = siteRows[0].onboarding_completed;
                    }
                } catch (error) {
                    console.error("Error attaching site data to session:", error);
                }
            }
            return session;
        },
   },
};