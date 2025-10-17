// src/app/api/social/cron/route.js
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const authToken = req.headers.get('authorization');
  if (authToken !== `Bearer ${process.env.CRON_SECRET}`) {
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
      let endpoint;
      let payload = {}; // Define payload object
      const { platform, content, image_url, user_email, video_url, title, board_id } = post;

      try {
        // --- START OF FIX ---
        // Build the payload based on the platform
        switch (platform) {
        case 'x':
    endpoint = '/api/social/x/create-post';
    payload = {
        user_email,
        content,
        imageUrl: image_url,
    };
    break;
          case 'facebook':
            endpoint = '/api/social/facebook/create-post';
            payload = { user_email, content, imageUrl: image_url };
            break;
          case 'pinterest':
            endpoint = '/api/social/pinterest/post';
            payload = { user_email, description: content, imageUrl: image_url, title: title, boardId: board_id };
            break;
          case 'instagram':
            endpoint = '/api/social/instagram/accounts/post';
            // Fetch the active instagram_user_id for this user
            const [igRows] = await connection.query(
              `SELECT active_instagram_user_id FROM social_connect WHERE user_email = ? AND platform = 'instagram'`,
              [user_email]
            );
            if (!igRows.length || !igRows[0].active_instagram_user_id) {
              throw new Error(`No active Instagram account found for user ${user_email}`);
            }
            payload = { 
              user_email, 
              caption: content, 
              imageUrl: image_url, 
              instagramUserId: igRows[0].active_instagram_user_id 
            };
            break;
          case 'youtube':
            endpoint = '/api/social/youtube/upload-video';
            payload = { user_email, description: content, videoUrl: video_url, title: title };
            break;
          default:
            throw new Error(`Unknown platform: ${platform}`);
        }
        // --- END OF FIX ---

        const postResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify(payload), // Send the constructed payload
        });
        
        if (!postResponse.ok) {
          const errorData = await postResponse.json();
          throw new Error(errorData.message || `API returned status ${postResponse.status}`);
        }

        await connection.query(
          "UPDATE scheduled_posts SET status = 'posted' WHERE id = ?",
          [post.id]
        );
        
        await connection.query(
          `UPDATE notifications SET message = 'A scheduled post has been posted', link = '/social', is_read = '0' WHERE id = ?`,
          [post.id]
        );

        console.log(`CRON JOB: Successfully posted scheduled post ID ${post.id} to ${platform}.`);
        results.push({ id: post.id, status: 'success' });

      } catch (error) {
        console.error(`CRON JOB: FAILED to post scheduled post ID ${post.id} to ${platform}. Reason: ${error.message}`);
        results.push({ id: post.id, status: 'failed', reason: error.message });
        // Optional: Update post status to 'failed' in DB
        await connection.query(
          "UPDATE scheduled_posts SET status = 'failed' WHERE id = ?",
          [post.id]
        );
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