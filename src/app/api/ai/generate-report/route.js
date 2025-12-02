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
        
        // --- THE FIX: Call Helper Directly (No Fetch) ---
        const contextData = await getReportingData(
            session.user.email, 
            body.startDate, 
            body.endDate
        );
        // ------------------------------------------------

        const prompt = `
            Generate a performance report based on this data: 
            ${JSON.stringify(contextData)}
            Format as HTML with sections: Summary, Key Metrics, and Actionable Tips.
        `;

        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!geminiResponse.ok) throw new Error('AI Error');
        
        const result = await geminiResponse.json();
        const rawText = result.candidates[0].content.parts[0].text;
        // Strip markdown code blocks if present
        const reportHtml = rawText.replace(/```html|```/g, '').trim();

        // 2. Charge Tokens
        const usedTokens = result.usageMetadata?.totalTokenCount || 1000;
        await chargeAiTokens(session.user.email, usedTokens);

        return NextResponse.json({ report: reportHtml });

    } catch (error) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}