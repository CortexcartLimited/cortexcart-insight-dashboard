import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';

async function fetchPageContent(url) {
    try {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) throw new Error(`Failed to fetch page. Status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(`Error fetching URL ${url}:`, error);
        throw new Error(`Could not retrieve content from ${url}. Please ensure the URL is correct and publicly accessible.`);
    }
}

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const connection = await db.getConnection();

    try {
        // Cooldown Logic
        const [lastReport] = await connection.query(
            `SELECT created_at FROM analysis_reports WHERE user_email = ? AND report_type = 'homepage' ORDER BY created_at DESC LIMIT 1`,
            [userEmail]
        );
        if (lastReport.length > 0) {
            const lastReportTime = new Date(lastReport[0].created_at);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (lastReportTime > twentyFourHoursAgo) {
                return NextResponse.json({ message: 'You can generate one homepage report per day. Please try again later.' }, { status: 429 });
            }
        }

        // Fetch Site URL
        const [rows] = await connection.query('SELECT site_url FROM sites WHERE user_email = ?', [userEmail]);
        const siteUrl = rows[0]?.site_url;
        if (!siteUrl) {
            throw new Error('Site URL not found. Please set it in your General settings.');
        }

        // Fetch HTML and create prompt
        const htmlContent = await fetchPageContent(siteUrl);
        const prompt = `
            As an expert e-commerce conversion rate optimization consultant, analyze the following HTML of a website's homepage.
            Provide actionable recommendations focusing on these three areas: SEO, Performance, and Copywriting.
            Your response MUST be a valid JSON object. Do not include any text or markdown formatting before or after the JSON object.
            The JSON object should have three main keys: "seo", "performance", and "copywriting".
            Each key should contain an array of objects, where each object has "recommendation" and "confidence".
            Here is the HTML content to analyze:
            \`\`\`html
            ${htmlContent.substring(0, 10000)}
            \`\`\`
        `;
        
        // Call Gemini API
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const geminiResponse = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

        if (!geminiResponse.ok) throw new Error('Failed to get a response from the AI model.');
        const result = await geminiResponse.json();
        
        if (result.candidates && result.candidates.length > 0) {
            const rawText = result.candidates[0].content.parts[0].text;
            const jsonText = rawText.replace(/```json|```/g, '').trim();
            const analysisData = JSON.parse(jsonText);

            // Save results to the database
            await connection.beginTransaction();

            const [reportResult] = await connection.query(
                'INSERT INTO analysis_reports (user_email, report_type) VALUES (?, ?)',
                [userEmail, 'homepage']
            );
            const reportId = reportResult.insertId;

            for (const [category, recommendations] of Object.entries(analysisData)) {
                if (Array.isArray(recommendations)) {
                    for (const rec of recommendations) {
                        await connection.query(
                            'INSERT INTO recommendation_items (report_id, category, recommendation, confidence) VALUES (?, ?, ?, ?)',
                            [reportId, category, rec.recommendation, rec.confidence]
                        );
                    }
                }
            }
            
            // Create a notification
            await connection.query(
                'INSERT INTO notifications (user_email, message, link) VALUES (?, ?, ?)',
                [userEmail, 'Your new Homepage Analysis Report is ready.', '/recommendations']
            );

            await connection.commit();
            
            return NextResponse.json({ message: 'Analysis complete and saved.', reportId: reportId }, { status: 200 });
        } else {
            throw new Error('No content received from the AI model.');
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error in homepage analysis API:', error);
        return NextResponse.json({ message: error.message || 'An internal error occurred.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
