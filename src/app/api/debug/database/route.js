// src/app/api/debug/database/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    console.log("Attempting to run database debug route...");

    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        const message = `Server is missing required database environment variables: ${missingVars.join(', ')}`;
        console.error(message);
        return NextResponse.json({
            status: 'Configuration Error',
            message: message
        }, { status: 500 });
    }

    try {
        // Attempt to get a connection from the pool and execute a simple query
        const connection = await db.getConnection();
        console.log("Successfully obtained a database connection.");
        
        await connection.query('SELECT 1'); // Simple query to test the connection is live
        connection.release(); // IMPORTANT: release the connection back to the pool
        
        console.log("Database connection test was successful.");
        return NextResponse.json({
            status: 'Success',
            message: 'Database connection is configured correctly and working.'
        });

    } catch (error) {
        console.error("CRITICAL DATABASE CONNECTION ERROR:", error);
        return NextResponse.json({
            status: 'Connection Failed',
            message: 'Failed to connect to the database. Check server logs for details.',
            error: error.message,
            code: error.code
        }, { status: 500 });
    }
}