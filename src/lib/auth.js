// src/lib/auth.js

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import FacebookProvider from "next-auth/providers/facebook";
import { db as prisma } from '@/lib/db';

/** @type {import('next-auth').AuthOptions} */
export const authOptions = {
    adapter: PrismaAdapter(prisma),
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
        async session({ token, session }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
                session.user.onboarding_completed = token.onboarding_completed;
                session.user.site_id = token.site_id;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                const dbUser = await prisma.user.findFirst({
                    where: { email: user.email },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.onboarding_completed = dbUser.onboarding_completed;
                    token.site_id = dbUser.site_id;
                }
            }
            return token;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};