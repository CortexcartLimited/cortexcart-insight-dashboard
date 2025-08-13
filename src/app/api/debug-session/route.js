// src/app/api/debug-session/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        console.log("Attempting to get session in debug route...");
        const session = await getServerSession(authOptions);

        if (!session) {
            console.log("No session found in debug route.");
            return NextResponse.json({ error: "No session found." }, { status: 401 });
        }

        console.log("Session object found:", JSON.stringify(session, null, 2));
        return NextResponse.json({ session }, { status: 200 });

    } catch (error) {
        console.error("Error in debug-session route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}