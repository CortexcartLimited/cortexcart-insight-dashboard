// src/app/api/user/social-connections/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; //
import { db } from "@/lib/db"; //
import { NextResponse } from "next/server";
export const runtime = 'nodejs';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    let connection; // Define connection variable
    try {
        connection = await db.getConnection(); // Get connection from pool

        // --- Corrected SQL Query ---
        const [rows] = await connection.query(
            `SELECT COUNT(*) as count 
             FROM social_connect 
             WHERE user_email = ? 
               AND platform IN ('facebook', 'pinterest', 'instagram', 'x', 'google', 'youtube')
               AND is_active = TRUE`, // Make sure 'is_active' column exists and is correct
            [session.user.email]
        );
        // --- End Corrected SQL Query ---

        const currentConnections = rows[0]?.count ?? 0; // Calculate count *after* query

        return NextResponse.json({ currentConnections }); // Return JSON *outside* SQL

    } catch (error) {
        console.error('Error fetching social connections count:', error); // Log the actual SQL error here
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (connection) connection.release(); // Release connection in finally block
    }
}