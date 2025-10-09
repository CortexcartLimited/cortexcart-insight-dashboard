import { db } from '@/lib/db';import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const siteId = searchParams.get('siteId');

    if (!path || !siteId) {
        return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }

    try {
        const [experiments] = await db.query(
            `SELECT * FROM ab_experiments WHERE user_email = ? AND status = 'running' AND target_path = ? LIMIT 1`,
            [siteId, path]
        );

        const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

        if (experiments.length === 0) {
            return NextResponse.json(null, { status: 200, headers: corsHeaders });
        }

        const experiment = experiments[0];
        const [variants] = await db.query('SELECT * FROM ab_variants WHERE experiment_id = ?', [experiment.id]);
        experiment.variants = variants;

        return NextResponse.json(experiment, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Error fetching active experiment:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function OPTIONS() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
