import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {db} from "@/lib/db";
import { NextResponse } from "next/server";

// We define a single handler function for the logic
async function handler(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const userEmail = session.user.email;
        
        const [userRows] = await db.query('SELECT id, name, email, createdAt FROM users WHERE email = ?', [userEmail]);
        const [siteRows] = await db.query('SELECT site_id, site_name, site_url, currency, createdAt FROM sites WHERE user_email = ?', [userEmail]);
        
        const exportData = {
            exportedAt: new Date().toISOString(),
            user: userRows[0] || null,
            sites: siteRows || [],
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="cortexcart_account_data.json"',
            },
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// Export the same handler for both GET and POST requests
export { handler as GET, handler as POST };