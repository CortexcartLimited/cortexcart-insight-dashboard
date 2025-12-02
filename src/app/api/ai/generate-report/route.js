import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAiLimit, chargeAiTokens, estimateTokens } from '@/lib/ai-limit';
import { getReportingData } from '@/lib/report-helper';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // 1. CHECK LIMIT
    const limitCheck = await checkAiLimit(session.user.email);
    if (!limitCheck.allowed) {
        return NextResponse.json({ message: limitCheck.error }, { status: 403 });
    }

    try {
        const body = await req.json();
        
        // 2. Fetch Data (Using Helper)
        const contextData = await getReportingData(
            session.user.email, // Helper now handles email lookup!
            body.startDate, 
            body.endDate
        );

        // 3. Construct Prompt
        const prompt = `
            You are an expert e-commerce analyst. Generate a performance report based on this data: 
            ${JSON.stringify(contextData)}
            
            Format the response as valid HTML (do NOT use markdown code blocks like \`\`\`html).
            
            Structure:
            <h2>Executive Summary</h2>
            <p>...</p>
            
            <h2>Key Metrics</h2>
            <ul>...</ul>
            
            <h2>Actionable Recommendations</h2>
            <ul>...</ul>
            
            Keep it professional, concise, and encouraging.
        `;

        // 4. Call Gemini API
        const apiKey = process.env.GEMINI_API_KEY;
        // Use the model that you confirmed works for generate-post
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!geminiResponse.ok) throw new Error('AI Model Failed');
        
        const result = await geminiResponse.json();
        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Clean up output (remove markdown if AI adds it despite instructions)
        const reportHtml = rawText.replace(/```html|```/g, '').trim();

        // 5. Charge Tokens
        const usedTokens = result.usageMetadata?.totalTokenCount || (estimateTokens(prompt) + estimateTokens(reportHtml));
        await chargeAiTokens(session.user.email, usedTokens);

        return NextResponse.json({ report: reportHtml });

    } catch (error) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}