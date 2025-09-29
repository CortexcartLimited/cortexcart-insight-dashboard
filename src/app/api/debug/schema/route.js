// src/app/api/debug/schema/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    console.log("Attempting to run schema debug route...");

    try {
        const connection = await db.getConnection();
        const schemaInfo = {};

        const tablesToDescribe = [
            'social_connect', 
            'facebook_pages_connected', 
            'User', // NextAuth's default user table
            'Account' // NextAuth's default account table
        ];

        for (const tableName of tablesToDescribe) {
            try {
                const [rows] = await connection.query(`DESCRIBE \`${tableName}\`;`);
                schemaInfo[tableName] = rows.map(row => ({
                    Field: row.Field,
                    Type: row.Type,
                    Null: row.Null,
                    Key: row.Key
                }));
            } catch (tableError) {
                schemaInfo[tableName] = { error: `Could not describe table. It might not exist.`, details: tableError.message };
            }
        }

        connection.release();
        
        return NextResponse.json({
            status: 'Success',
            schema: schemaInfo
        });

    } catch (error) {
        console.error("CRITICAL SCHEMA DEBUG ERROR:", error);
        return NextResponse.json({
            status: 'Failed to run debug route',
            error: error.message
        }, { status: 500 });
    }
}