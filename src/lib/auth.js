// src/lib/auth.js

import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import FacebookProvider from "next-auth/providers/facebook";
// We will use your existing 'db' connection for everything
import { db } from '@/lib/db';

/** @type {import('next-auth').AuthOptions} */
export const authOptions = {
    // --- The adapter has been completely removed ---
    
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
            version: '2.0',
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        // --- This callback now handles user creation with your custom schema ---
        async signIn({ user, account, profile }) {
            const connection = await db.getConnection();
            try {
                // Check if a user with this email already exists in your 'sites' table
                const [existingUsers] = await connection.query(
                    'SELECT * FROM sites WHERE email = ? LIMIT 1',
                    [user.email]
                );

                if (existingUsers.length === 0) {
                    // If the user doesn't exist, create them in the 'sites' table
                    await connection.query(
                        'INSERT INTO sites (email, name, image, site_id) VALUES (?, ?, ?, ?)',
                        [user.email, user.name, user.image, `site_${Math.random().toString(36).substr(2, 9)}`]
                    );
                }

                // Now, link the social account in your 'social_connect' table
                await connection.query(
                    `INSERT INTO social_connect (user_email, platform, access_token_encrypted, provider_account_id)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     access_token_encrypted = VALUES(access_token_encrypted);`,
                    [user.email, account.provider, account.access_token, account.providerAccountId]
                );

                return true; // Allow the sign-in
            } catch (error) {
                console.error("Error during signIn callback:", error);
                return false; // Prevent sign-in if there's a database error
            } finally {
                connection.release();
            }
        },
        async jwt({ token, user }) {
            if (user) {
                // On the first login, add custom user data to the token
                const connection = await db.getConnection();
                try {
                    const [rows] = await connection.query('SELECT id, onboarding_completed, site_id FROM sites WHERE email = ?', [user.email]);
                    const dbUser = rows[0];
                    if (dbUser) {
                        token.id = dbUser.id;
                        token.onboarding_completed = dbUser.onboarding_completed;
                        token.site_id = dbUser.site_id;
                    }
                } finally {
                    connection.release();
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                // Add the custom properties from the token to the session object
                session.user.id = token.id;
                session.user.onboarding_completed = token.onboarding_completed;
                session.user.site_id = token.site_id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};