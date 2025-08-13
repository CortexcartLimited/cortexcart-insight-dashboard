import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

// This is a protected route that should only be triggered by a secure cron job
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;

    try {
        const connection = await db.getConnection();

        // 1. Analyze user's historical traffic data from the 'events' table
        const [trafficData] = await connection.query(
            `SELECT 
                DAYOFWEEK(created_at) as dayOfWeek, 
                HOUR(created_at) as hourOfDay,
                COUNT(*) as views
             FROM events 
             WHERE 
                site_id = ? AND event_name = 'pageview'
             GROUP BY dayOfWeek, hourOfDay
             ORDER BY views DESC`,
            [userEmail]
        );

        if (trafficData.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Not enough traffic data to analyze.' }, { status: 200 });
        }

        // 2. Get the user's saved target demographics
        const [demographics] = await connection.query(
            'SELECT age_range, sex, country FROM social_demographics WHERE user_email = ?',
            [userEmail]
        );
        const targetAudience = demographics.length > 0 ? demographics[0] : { age_range: 'any', sex: 'any', country: 'any' };

        // 3. Create a detailed prompt for the AI
        const prompt = `
            As an expert data analyst, your task is to determine the single best day of the week and the top 3 best hours of the day to post on social media for the following target audience: ${JSON.stringify(targetAudience)}.

            Here is their website traffic data from the last month, showing visitor counts by day of the week (where 1=Sunday, 7=Saturday) and hour of the day (0-23):
            ${JSON.stringify(trafficData)}

            Based on this data, provide your response ONLY as a valid JSON object with two keys:
            1. "optimal_day": A single integer representing the best day of the week (1-7).
            2. "optimal_times": A comma-separated string of the top 3 best hours (e.g., "9,14,20").
        `;

        // 4. Call the Gemini API
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            throw new Error('Failed to get a response from the AI model.');
        }

        const result = await geminiResponse.json();
        const rawText = result.candidates[0].content.parts[0].text;
        const jsonText = rawText.replace(/```json|```/g, '').trim();
        const analysisData = JSON.parse(jsonText);

        // 5. Update the social_optimal_times table with the new AI-generated data
        // This will overwrite previous settings for this demographic combination.
        const updateQuery = `
            INSERT INTO social_optimal_times (platform, age_range, sex, country, optimal_day, optimal_times)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                optimal_day = VALUES(optimal_day),
                optimal_times = VALUES(optimal_times);
        `;
        
        // This example updates for both X and Pinterest based on the same analysis
        await connection.query(updateQuery, ['x', targetAudience.age_range, targetAudience.sex, targetAudience.country, analysisData.optimal_day, analysisData.optimal_times]);
        await connection.query(updateQuery, ['pinterest', targetAudience.age_range, targetAudience.sex, targetAudience.country, analysisData.optimal_day, analysisData.optimal_times]);

        connection.release();

        return NextResponse.json({ message: 'Optimal posting times have been successfully updated by AI analysis.' }, { status: 200 });

    } catch (error) {
        console.error('Error during AI analysis of posting times:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}