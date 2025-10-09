import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        const clientId = process.env.PINTEREST_CLIENT_ID;
        // IMPORTANT: This now points to our new custom callback route
        const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/callback/pinterest`;
        const scope = 'boards:read pins:read user_accounts:read';
        
        // We pass the user's real email in the 'state' parameter for security
        const state = session.user.email; 

        const authUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
        
        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error("Error creating Pinterest auth URL:", error);
        const errorRedirectUrl = new URL('/settings', process.env.NEXTAUTH_URL);
        errorRedirectUrl.searchParams.set('error', 'Could not initiate Pinterest connection.');
        return NextResponse.redirect(errorRedirectUrl);
    }
}