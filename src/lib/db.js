// src/lib/db.js

import mysql from 'mysql2/promise';

// This is a check to see if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// We'll store our connection pool in a global variable to ensure it's a singleton.
// This prevents multiple pools from being created during hot-reloads in development.
let pool;

if (isProduction) {
  // In production, we can just create the pool once.
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 15, // You can slightly increase this for production
    queueLimit: 0,
  });
} else {
  // In development, we need to check if a pool already exists on the global object.
  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  pool = global._mysqlPool;
}

// Export the single, shared pool instance.
// Note: We are using a named export here.
export const db = pool;