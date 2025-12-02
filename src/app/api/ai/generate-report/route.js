import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAiLimit, chargeAiTokens, estimateTokens } from '@/lib/ai-limit';
import { getReportingData } from '@/lib/report-helper';

export async function POST(req) {
    // 1. Auth Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // 2. Limit Check
    const limitCheck = await checkAiLimit(session.user.email);
    if (!limitCheck.allowed) {
        return NextResponse.json({ message: limitCheck.error }, { status: 403 });
    }

    try {
        // 3. Parse Request Body (Safely)
        let body = {};
        try {
            const text = await req.text();
            if (text) body = JSON.parse(text);
        } catch (e) {
            console.warn("Empty request body, using defaults.");
        }
        
        // 4. Get Data from DB
        const contextData = await getReportingData(
            session.user.email, 
            body.startDate, 
            body.endDate
        );

        // 5. Construct Prompt
        const prompt = `
            You are Cortexcart's AI Analyst. Generate a performance report based on this data: 
            ${JSON.stringify(contextData)}
            
            Output MUST be valid HTML (no markdown blocks).
            Structure:
            <div class="space-y-6">
                <section>
                    <h2 class="text-xl font-bold mb-3">Executive Summary</h2>
                    <p>...</p>
                </section>
                <section>
                    <h2 class="text-xl font-bold mb-3">Key Metrics</h2>
                    <ul class="list-disc pl-5">...</ul>
                </section>
                <section>
                    <h2 class="text-xl font-bold mb-3">Actionable Recommendations</h2>
                    <ul class="list-disc pl-5">...</ul>
                </section>
            </div>
        `;

        // 6. Call Gemini API (Stable Model)
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        // CHANGED: Using 1.5-flash for stability
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        // --- DEBUGGING: Read raw text first ---
        const responseText = await geminiResponse.text();
        
        if (!geminiResponse.ok) {
            console.error("🔥 AI API Error Response:", responseText);
            throw new Error(`AI Request Failed: ${geminiResponse.status}`);
        }

        if (!responseText) {
             throw new Error("AI returned an empty response.");
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error("🔥 Invalid JSON from AI:", responseText);
            throw new Error("AI returned invalid JSON.");
        }

        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const reportHtml = rawText.replace(/```html|```/g, '').trim();

        // 7. Charge Tokens
        const usedTokens = result.usageMetadata?.totalTokenCount || (estimateTokens(prompt) + estimateTokens(reportHtml));
        await chargeAiTokens(session.user.email, usedTokens);

        return NextResponse.json({ report: reportHtml });

    } catch (error) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}