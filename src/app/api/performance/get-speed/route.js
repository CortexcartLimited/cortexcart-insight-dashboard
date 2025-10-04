import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
// We don't need the pagespeed library for this test
// import { runPageSpeed } from '@/lib/pagespeed';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // --- TEMPORARY TEST CODE ---
    // This test bypasses the external connection to Google's API.
    // It returns a fake, successful response instead.
    console.log("--- GET-SPEED API: Running temporary test code. ---");
    const fakeData = {
        performanceScore: 88,
        seoScore: 95,
        lcp: '1.2s',
        cls: '0.05'
    };
    return NextResponse.json(fakeData);
    // --- END OF TEST CODE ---
}