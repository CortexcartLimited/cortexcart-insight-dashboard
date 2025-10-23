// src/app/api/user/social-connections/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { BasePlatform } from "chart.js";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(`
SELECT COUNT(*) as count
FROM social_connect
WHERE user_email = ?
  AND platform IN ('facebook', 'pinterest', 'instagram', 'x', 'google', 'youtube')
        const currentConnections = rows[0]?.count || 0;

        return NextResponse.json({ currentConnections });
`);

    } catch (error) {
        console.error('Error fetching social connections count:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}