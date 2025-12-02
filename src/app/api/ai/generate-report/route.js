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
        
        // 2. GET DATA
        const contextData = await getReportingData(
            session.user.email, 
            body.startDate, 
            body.endDate
        );

        // 3. CONSTRUCT PROMPT
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
            
            Keep it professional, concise, and encouraging.
        `;

        // 4. CALL GEMINI
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        // Using the stable Flash model which is most reliable
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        // --- SAFER RESPONSE HANDLING ---
        const responseText = await geminiResponse.text();
        
        if (!geminiResponse.ok) {
            console.error("🔥 AI API Error Response:", responseText);
            throw new Error(`AI Request Failed: ${geminiResponse.status} ${geminiResponse.statusText}`);
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
        
        // Cleanup markdown
        const reportHtml = rawText.replace(/```html|```/g, '').trim();

        // 5. CHARGE TOKENS
        const usedTokens = result.usageMetadata?.totalTokenCount || (estimateTokens(prompt) + estimateTokens(reportHtml));
        await chargeAiTokens(session.user.email, usedTokens);

        return NextResponse.json({ report: reportHtml });

    } catch (error) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}