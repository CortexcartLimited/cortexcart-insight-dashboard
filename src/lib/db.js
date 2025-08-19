// src/lib/db.js

import mysql from 'mysql2/promise';

// This creates the connection pool.
// We've updated the property names to match your .env.local file.
export const db = mysql.createPool({
    host: process.env.MYSQL_HOST,         // Changed from DB_HOST
    user: process.env.MYSQL_USER,         // Changed from DB_USERNAME
    password: process.env.MYSQL_PASSWORD, // Changed from DB_PASSWORD
    database: process.env.MYSQL_DATABASE, // Changed from DB_DATABASE
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});