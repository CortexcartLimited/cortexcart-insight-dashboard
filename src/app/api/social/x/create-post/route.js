// src/app/api/social/x/create-post/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  // --- START OF SECURITY FIX ---
  // This checks for the internal secret key passed from our cron job.
  const internalAuthToken = req.headers.get('authorization');
  if (internalAuthToken !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    console.error('Unauthorized internal API call to /api/social/x/create-post');
    return new Response('Unauthorized', { status: 401 });
  }
  // --- END OF SECURITY FIX ---
    try {
        const body = await req.json();
        const { content } = body;

        // This is a simplified example for X/Twitter
        // You would replace this with your actual Twitter API call logic
        console.log(`Posting to X/Twitter: ${content}`);
        
        // --- Your actual Twitter posting logic would go here ---
        // const twitterClient = new TwitterApi(...);
        // await twitterClient.v2.tweet(content);
        
        // Simulate a successful post for now
        const postId = `x_${Date.now()}`;

        return NextResponse.json({ success: true, postId }, { status: 200 });

    } catch (error) {
        console.error("CRITICAL Error posting to X/Twitter:", error);
        return NextResponse.json({ error: 'Failed to post to X/Twitter.', details: error.message }, { status: 500 });
    }
}