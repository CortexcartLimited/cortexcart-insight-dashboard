import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PATCH(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;
        const { status } = await request.json();

        // Validate status enum
        const validStatuses = ['draft', 'running', 'finished'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        // Only allow 1 running experiment per path to prevent conflicts (Optional but recommended)
        if (status === 'running') {
            // Get the path of the experiment we want to run
            const [targetExp] = await db.query('SELECT target_path FROM ab_experiments WHERE id = ?', [id]);
            
            if (targetExp.length > 0) {
                // Stop any OTHER running experiments on this same path
                await db.query(
                    `UPDATE ab_experiments SET status = 'draft' 
                     WHERE user_email = ? AND status = 'running' AND target_path = ? AND id != ?`,
                    [session.user.email, targetExp[0].target_path, id]
                );
            }
        }

        // Update the status
        await db.query(
            'UPDATE ab_experiments SET status = ? WHERE id = ? AND user_email = ?',
            [status, id, session.user.email]
        );

        return NextResponse.json({ message: 'Experiment updated' }, { status: 200 });

    } catch (error) {
        console.error('Error updating experiment:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// Handle Delete (Bonus: allows you to delete experiments)
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        await db.query(
            'DELETE FROM ab_experiments WHERE id = ? AND user_email = ?',
            [params.id, session.user.email]
        );
        return NextResponse.json({ message: 'Deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting' }, { status: 500 });
    }
}