// publish-scheduled-posts.js

const path = require('path');
// This line now creates an absolute path to your .env.local file
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

const mysql = require('mysql2/promise');

async function publishPosts() {
  console.log('Connecting to the database...');
  let connection;

  // Check if all necessary environment variables are loaded
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE) {
    console.error('❌ Error: Database environment variables are not loaded. Check the path in the script.');
    return;
  }

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log('Checking for scheduled posts to publish...');

    const [result] = await connection.query(
      `UPDATE scheduled_posts 
       SET status = 'published' 
       WHERE status = 'scheduled' AND published_at <= NOW()`
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Success! Published ${result.affectedRows} new post(s).`);
    } else {
      console.log('No posts were scheduled for publication at this time.');
    }
  } catch (error) {
    console.error('❌ An error occurred:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

publishPosts();