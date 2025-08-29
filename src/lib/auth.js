import { getServerSession } from "next-auth/next";
import GoogleProvider from 'next-auth/providers/google';
import TwitterProvider from 'next-auth/providers/twitter';
import FacebookProvider from "next-auth/providers/facebook";
import PinterestProvider from "next-auth/providers/pinterest";
import { db } from '@/lib/db';
import axios from 'axios';
import { encrypt } from '@/lib/crypto';
import bcrypt from 'bcryptjs';
import CredentialsProvider from "next-auth/providers/credentials";

/** @type {import('next-auth').AuthOptions} */
export const authOptions = {
    adapter: undefined,
    debug: process.env.NODE_ENV !== 'production',

    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                
                try {
                    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [credentials.email]);
                    if (rows.length === 0) return null;
                    
                    const user = rows[0];
                    const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);

                    if (!passwordMatch) return null;
                    
                    return { id: user.id, email: user.email, name: user.name };
                } catch (error) {
                    console.error("Credentials auth error:", error);
                    return null;
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
            clientId: process.env.X_CLIENT_ID,
            clientSecret: process.env.X_CLIENT_SECRET,
            version: "2.0",
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            scope: 'email, public_profile',
        }),
         PinterestProvider({
            clientId: process.env.PINTEREST_CLIENT_ID,
            clientSecret: process.env.PINTEREST_CLIENT_SECRET,
            scope: 'boards:read, pins:read, user_accounts:read',
        }),
    ],
    cookies: {
        sessionToken: {
            name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    callbacks: {
        async signIn({ user, account }) {
                  // --- DEBUGGING ---
      console.log("NextAuth SignIn Callback Triggered");
      console.log("Provider:", account.provider);
      console.log("User Object:", user);
      console.log("Profile Object:", profile);
                  // --- END DEBUGGING ---
    let { email, name } = user;

    // Existing fallback for Twitter
    if (account.provider === 'twitter' && !email) {
        email = `${user.id}@users.twitter.com`;
    }
      if (account.provider === 'pinterest' && !userEmail) {
                console.log("Pinterest user has no email. Creating a placeholder.");
                // Use the user's unique ID from Pinterest to create a fake email.
                userEmail = `${user.id}@users.pinterest.com`;
                // IMPORTANT: We must update the top-level user object so the session gets the new email.
                user.email = userEmail;
            }

            // --- General Logic for All Providers ---
            // If after all that, we still don't have an email, we can't proceed.
            if (!userEmail) {
                console.error(`Sign-in denied for ${account.provider}. Email not available.`);
                return false; // This will stop the login and show an error.
            }

            // --- Database Interaction ---
            // Now we can safely interact with the database.
            try {
                // Check if a user with this email already exists in our 'sites' table.
                const [existingUser] = await db.query('SELECT * FROM sites WHERE user_email = ?', [userEmail]);

                // If they don't exist, create a new entry for them.
                if (existingUser.length === 0) {
                    console.log(`New user: ${userEmail}. Creating site entry.`);
                    await db.query('INSERT INTO sites (user_email, site_name) VALUES (?, ?)', [userEmail, `${userName}'s Site`]);
                } else {
                    console.log(`Returning user: ${userEmail}`);
                }

                return true; // The sign-in was successful.
            } catch (error) {
                // If the database query fails for any reason, log the error and stop the sign-in.
                console.error("Database error during signIn:", error);
                return false;
            }
        },

        async jwt({ token, user, account }) {
            if (account && user) {
                token.id = user.id;
                token.email = user.email || `${user.id}@users.twitter.com`;
                token.name = user.name;
                token.picture = user.image;

                try {
                    const query = `
                        INSERT INTO social_connect (user_email, platform, access_token_encrypted, refresh_token_encrypted, expires_at)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            access_token_encrypted = VALUES(access_token_encrypted), 
                            refresh_token_encrypted = VALUES(refresh_token_encrypted),
                            expires_at = VALUES(expires_at);
                    `;
                    await db.query(query, [token.email, account.provider, encrypt(account.access_token), encrypt(account.refresh_token), new Date(account.expires_at * 1000)]);
                } catch (dbError) {
                    console.error("CRITICAL ERROR saving social connection:", dbError);
                }

                if (account.provider === 'facebook') {
                    try {
                        const pagesResponse = await axios.get(`https://graph.facebook.com/me/accounts?fields=id,name,access_token,picture&access_token=${account.access_token}`);
                        if (pagesResponse.data.data) {
                            for (const page of pagesResponse.data.data) {
                                const pageQuery = `
                                    INSERT INTO facebook_pages (user_email, page_id, page_name, access_token_encrypted)
                                    VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE
                                    page_name = VALUES(page_name), access_token_encrypted = VALUES(access_token_encrypted);`;
                                await db.query(pageQuery, [token.email, page.id, page.name, encrypt(page.access_token)]);
                            }
                        }
                    } catch (error) { 
                        console.error("[AUTH] Error fetching FB Pages:", error.response?.data?.error); 
                    }
                }

                // --- FIX 1: Isolate the entire Pinterest board fetching process ---
                // If this fails, it will now log the error but will NOT crash the login process.
                if (account.provider === 'pinterest') {
                    try {
                        const boardsResponse = await axios.get('https://api.pinterest.com/v5/boards', {
                            headers: { 'Authorization': `Bearer ${account.access_token}` }
                        });
                        
                        if (boardsResponse.data && boardsResponse.data.items) {
                            for (const board of boardsResponse.data.items) {
                                await db.query(
                                    `INSERT INTO pinterest_boards (user_email, board_id, board_name)
                                     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE board_name = VALUES(board_name);`,
                                    [token.email, board.id, board.name]
                                );
                            }
                        }
                    } catch (error) {
                        console.error("[AUTH.JS] JWT WARNING: Could not fetch/save Pinterest boards during login.", error.response ? error.response.data : error.message);
                    }
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
            }

            // --- FIX 2: Make fetching boards for the session resilient ---
            // If the database connection fails here, it logs the error and provides an empty array, preventing a crash.
            try {
                const [boards] = await db.query('SELECT board_id, board_name FROM pinterest_boards WHERE user_email = ?', [token.email]);
                session.user.pinterestBoards = boards || [];
            } catch (error) {
                console.error("[AUTH.JS] SESSION WARNING: Failed to attach Pinterest boards to session.", error);
                session.user.pinterestBoards = []; // Default to an empty array on error
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
 
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};