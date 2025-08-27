import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { google } from 'googleapis'; // Pinterest uses Google for OAuth tokens in your setup

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- DEMO MODE CHECK ---
    // If demo mode is on, we simulate a successful post and exit early.
    if (process.env.PINTEREST_DEMO_MODE === 'true') {
        console.log("Pinterest DEMO MODE: Simulating a successful Pin creation.");
        // We add a small delay to make the simulation feel more realistic for the video.
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        return NextResponse.json({ 
            message: 'Pin successfully created! (This is a demo response)',
            id: `demo_pin_${Date.now()}` // A fake but unique Pin ID
        }, { status: 201 });
    }

    // --- REGULAR PRODUCTION LOGIC ---
    // This code will only run if PINTEREST_DEMO_MODE is not 'true'.
    const { boardId, imageUrl, title, description } = await req.json();

    if (!boardId || !imageUrl || !title) {
        return NextResponse.json({ error: 'Missing board, image, or title' }, { status: 400 });
    }

    try {
        // Get the refresh token from your database
        const [rows] = await db.query(
            'SELECT refresh_token_encrypted FROM social_connect WHERE user_email = ? AND platform = ?',
            [session.user.email, 'pinterest']
        );

        if (rows.length === 0 || !rows[0].refresh_token_encrypted) {
            return NextResponse.json({ error: 'Pinterest account not connected or refresh token is missing.' }, { status: 401 });
        }

        const refreshToken = decrypt(rows[0].refresh_token_encrypted);

        // Exchange refresh token for a new access token
        const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        const tokenData = await response.json();
        if (!response.ok) {
            throw new Error(tokenData.message || 'Failed to refresh Pinterest token');
        }

        const accessToken = tokenData.access_token;

        // Create the Pin
        const pinResponse = await fetch('https://api.pinterest.com/v5/pins', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board_id: boardId,
                media_source: {
                    source_type: 'image_url',
                    url: imageUrl
                },
                title: title,
                description: description
            })
        });

        const pinData = await pinResponse.json();

        if (!pinResponse.ok) {
            // This is the error you were seeing
            throw new Error(pinData.message || `Pinterest API responded with status ${pinResponse.status}`);
        }

        return NextResponse.json(pinData, { status: 201 });

    } catch (error) {
        console.error("Error creating Pinterest Pin:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}