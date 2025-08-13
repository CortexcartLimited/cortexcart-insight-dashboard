// src/app/api/get-site-id/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // This is the session.user.site_id we added in the auth.js callback
    const siteId = session.user.site_id;

    if (!siteId) {
        return new NextResponse("Site ID not found in session.", { status: 404 });
    }

    return NextResponse.json({ siteId: siteId }, { status: 200 });
}