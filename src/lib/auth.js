import { db } from '@/lib/db';
import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import TwitterProvider from 'next-auth/providers/twitter';
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from 'bcrypt';

export const authOptions = {
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        }),
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
            version: "2.0",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }
                try {
                    const [userRows] = await db.query('SELECT * FROM User WHERE email = ?', [credentials.email]);
                    if (userRows.length === 0) {
                        return null;
                    }
                    const user = userRows[0];
                    const isPasswordValid = await compare(credentials.password, user.password);
                    if (!isPasswordValid) {
                        return null;
                    }
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    };
                } catch (error) {
                    console.error("Database error during authorization:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
            }

            // --- THE FIX IS HERE ---
            // We'll wrap the database calls in a try...catch block to prevent crashes.
            try {
                // Fetch Pinterest boards and attach to session
                const [pinterestBoards] = await db.query(
                    'SELECT board_id, board_name FROM pinterest_boards WHERE user_email = ?',
                    [session.user.email]
                );
                session.user.pinterestBoards = pinterestBoards;

                // Fetch Instagram accounts and attach to session
                const [instagramAccounts] = await db.query(
                    'SELECT instagram_user_id, username FROM instagram_accounts WHERE user_email = ?',
                    [session.user.email]
                );
                session.user.instagramAccounts = instagramAccounts;

            } catch (error) {
                // If the database connection fails, log the error but DON'T crash.
                // The user will still get a valid session, just without the boards/accounts.
                console.error("[AUTH.JS] SESSION WARNING: Could not attach social data to session.", error);
                // Ensure these properties exist on the session even if they fail to load.
                session.user.pinterestBoards = session.user.pinterestBoards || [];
                session.user.instagramAccounts = session.user.instagramAccounts || [];
            }
            
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};