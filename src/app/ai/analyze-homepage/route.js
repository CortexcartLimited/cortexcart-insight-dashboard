import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Helper function to fetch the HTML content of a URL
async function fetchPageContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch page. Status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching URL ${url}:`, error);
        throw new Error(`Could not retrieve content from ${url}. Please ensure the URL is correct and publicly accessible.`);
    }
}

// Corrected: Removed unused 'request' parameter
export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = session.user.email;

    try {
        // 1. Get the user's site URL from the database
        const [rows] = await db.query('SELECT site_url FROM sites WHERE user_email = ?', [userEmail]);
        const siteUrl = rows[0]?.site_url;

        if (!siteUrl) {
            return NextResponse.json({ message: 'Site URL not found. Please set it in your General settings.' }, { status: 400 });
        }

        // 2. Fetch the HTML content of the user's homepage
        const htmlContent = await fetchPageContent(siteUrl);

        // 3. Construct the prompt for the Gemini API
        const prompt = `
            As an expert e-commerce conversion rate optimization consultant, analyze the following HTML of a website's homepage.
            Provide actionable recommendations focusing on these three areas: SEO, Performance, and Copywriting.
            
            Your response MUST be a valid JSON object. Do not include any text or markdown formatting before or after the JSON object.
            
            The JSON object should have three main keys: "seo", "performance", and "copywriting".
            Each key should contain an array of objects, where each object has two properties: "recommendation" (a string with your advice) and "confidence" (a number between 0 and 1 indicating your confidence in the impact of the recommendation).

            Here is the HTML content to analyze:
            \`\`\`html
            ${htmlContent.substring(0, 10000)}
            \`\`\`
        `;

        // 4. Call the Gemini API
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = ""; // Leave as-is
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            throw new Error('Failed to get a response from the AI model.');
        }

        const result = await geminiResponse.json();

        if (result.candidates && result.candidates.length > 0) {
            const rawText = result.candidates[0].content.parts[0].text;
            // Clean up the response to ensure it's valid JSON
            const jsonText = rawText.replace(/```json|```/g, '').trim();
            const analysisData = JSON.parse(jsonText);
            return NextResponse.json(analysisData, { status: 200 });
        } else {
            throw new Error('No content received from the AI model.');
        }

    } catch (error) {
        console.error('Error in homepage analysis API:', error);
        return NextResponse.json({ message: error.message || 'An internal error occurred.' }, { status: 500 });
    }
}
