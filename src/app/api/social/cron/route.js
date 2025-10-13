// src/app/api/social/cron/route.js
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  // --- START OF DEBUGGING CODE ---
  const authToken = req.headers.get('authorization');
  const serverCronSecret = process.env.CRON_SECRET;

  console.log(`CRON JOB DEBUG: Received Authorization Header: [${authToken}]`);
  console.log(`CRON JOB DEBUG: Server's Loaded CRON_SECRET: [Bearer ${serverCronSecret}]`);
  // --- END OF DEBUGGING CODE ---

  if (authToken !== `Bearer ${serverCronSecret}`) {
    console.error('CRON JOB ERROR: Authorization failed due to mismatch.');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('CRON JOB: Authorized. Checking for scheduled social posts...');

  let connection;
  try {
    connection = await db.getConnection();

    const [postsToProcess] = await connection.query(
      "SELECT * FROM scheduled_posts WHERE status = 'scheduled' AND scheduled_at <= NOW()"
    );

    if (postsToProcess.length === 0) {
      console.log('CRON JOB: No posts to publish at this time.');
      return NextResponse.json({ message: 'No posts to publish.' });
    }

    console.log(`CRON JOB: Found ${postsToProcess.length} post(s) to process.`);
    const results = [];

    for (const post of postsToProcess) {
      // ... (rest of your existing code for processing posts)
      let endpoint;
      const { platform, content, image_url, user_email, scheduled_at } = post;

      switch (platform) {
        case 'x':
          endpoint = '/api/social/x/create-post';
          break;
        case 'facebook':
          endpoint = '/api/social/facebook/create-post';
          break;
        case 'pinterest':
          endpoint = '/api/social/pinterest/post';
          break;
        default:
          console.error(`CRON JOB: Unknown platform for post ID ${post.id}: ${platform}`);
          results.push({ id: post.id, status: 'failed', reason: `Unknown platform: ${platform}` });
          continue;
      }

      try {
        const postResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            user_email: user_email,
            content: content,
            imageUrl: image_url,
          }),
        });
        
        if (!postResponse.ok) {
          const errorData = await postResponse.json();
          throw new Error(errorData.message || `API returned status ${postResponse.status}`);
        }

        await connection.query(
          "UPDATE social_posts SET status = 'posted' WHERE id = ?",
          [post.id]
        );
        console.log(`CRON JOB: Successfully posted scheduled post ID ${post.id} to ${platform}.`);
        results.push({ id: post.id, status: 'success' });

      } catch (error) {
        console.error(`CRON JOB: FAILED to post scheduled post ID ${post.id} to ${platform}. Reason: ${error.message}`);
        results.push({ id: post.id, status: 'failed', reason: error.message });
      }
    }

    return NextResponse.json({ message: 'Cron job completed.', results });

  } catch (error) {
    console.error('CRON JOB: A critical error occurred:', error);
    return new Response('Internal Server Error', { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}