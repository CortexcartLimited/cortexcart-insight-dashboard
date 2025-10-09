import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM events WHERE site_id = ?', [userEmail]);
        await connection.query('DELETE FROM sites WHERE user_email = ?', [userEmail]);
        // Also delete from the new NextAuth tables
        await connection.query('DELETE FROM users WHERE email = ?', [userEmail]);
        await connection.commit();

        return NextResponse.json({ message: 'Account and all data deleted successfully.' }, { status: 200 });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting account:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        connection.release();
    }
}
