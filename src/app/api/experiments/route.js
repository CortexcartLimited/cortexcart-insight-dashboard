import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// 1. GET: List all experiments for the dashboard (Fixes 400 Error)
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [experiments] = await db.query(
            `SELECT * FROM ab_experiments WHERE user_email = ? ORDER BY created_at DESC`,
            [session.user.email]
        );
        return NextResponse.json(experiments);
    } catch (error) {
        console.error('Error fetching experiments:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// 2. POST: Create a new experiment (Fixes 405 Error)
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, target_selector, target_path, control_content, variant_content } = body;

        // Insert Experiment
        const [expResult] = await db.query(
            `INSERT INTO ab_experiments (user_email, name, description, target_selector, target_path, status)
             VALUES (?, ?, ?, ?, ?, 'draft')`,
            [session.user.email, name, description, target_selector, target_path]
        );

        const experimentId = expResult.insertId;

        // Insert Variants (Control & Variant)
        await db.query(
            `INSERT INTO ab_variants (experiment_id, name, content, is_control) VALUES ?`,
            [[
                [experimentId, 'Control', control_content, true],
                [experimentId, 'Variant A', variant_content, false]
            ]]
        );

        return NextResponse.json({ message: 'Experiment created', id: experimentId }, { status: 201 });

    } catch (error) {
        console.error('Error creating experiment:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}