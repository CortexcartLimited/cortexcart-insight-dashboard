import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAiLimit, chargeAiTokens, estimateTokens } from '@/lib/ai-limit';
import { getReportingData } from '@/lib/report-helper';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const limitCheck = await checkAiLimit(session.user.email);
    if (!limitCheck.allowed) {
        return NextResponse.json({ message: limitCheck.error }, { status: 403 });
    }

    try {
        let body = {};
        try {
            const text = await req.text();
            if (text) body = JSON.parse(text);
        } catch (e) {
            console.warn("Empty request body, using defaults.");
        }
        
        const contextData = await getReportingData(
            session.user.email, 
            body.startDate, 
            body.endDate
        );

        // --- UPDATED PROMPT WITH INSTRUCTIONS FOR MISSING DATA ---
        const prompt = `
            You are Cortexcart's AI Analyst. Generate a performance report based on this data: 
            ${JSON.stringify(contextData)}
            
            Output MUST be valid HTML (no markdown blocks).
            
            CRITICAL INSTRUCTIONS FOR DATA:
            1. If 'stats.totalRevenue' equals "Not Connected":
               - In the Key Metrics section, write: "<strong>Revenue:</strong> Data unavailable. Please connect your Shopify store in Settings to unlock financial insights."
               - Do NOT invent a revenue number.
            
            2. If 'stats.totalRevenue' equals "Sync Error":
               - Write: "<strong>Revenue:</strong> Sync Error. Please check your Shopify connection."

            3. If 'stats.visitors' is 0:
               - Mention that no traffic was detected and suggest checking if the tracking script is installed.

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

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const responseText = await geminiResponse.text();
        
        if (!geminiResponse.ok) {
            console.error("🔥 AI API Error Response:", responseText);
            throw new Error(`AI Request Failed: ${geminiResponse.status}`);
        }

        if (!responseText) throw new Error("AI returned an empty response.");

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error("AI returned invalid JSON.");
        }

        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const reportHtml = rawText.replace(/```html|```/g, '').trim();

        const usedTokens = result.usageMetadata?.totalTokenCount || (estimateTokens(prompt) + estimateTokens(reportHtml));
        await chargeAiTokens(session.user.email, usedTokens);

        return NextResponse.json({ report: reportHtml });

    } catch (error) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}