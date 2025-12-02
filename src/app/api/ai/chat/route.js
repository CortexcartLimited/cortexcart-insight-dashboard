import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAiLimit, chargeAiTokens, estimateTokens } from '@/lib/ai-limit';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ reply: "Please log in." }, { status: 401 });
    }

    // 1. CHECK LIMIT
    const limitCheck = await checkAiLimit(session.user.email);
    if (!limitCheck.allowed) {
      return NextResponse.json({ reply: `🚫 ${limitCheck.error}` }, { status: 200 });
    }

    const { message, context } = await req.json();
    
    // FIX: Use the same key variable as your working route
    const apiKey = process.env.GEMINI_API_KEY; 

    // 2. Construct Prompt
    const prompt = `
      You are Cortexcart's AI Business Analyst.
      CONTEXT DATA: ${JSON.stringify(context)}
      USER QUESTION: "${message}"
      Keep the answer concise and helpful.
    `;

    // 3. Call Gemini API (Using the working model 2.0-flash)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    if (!geminiResponse.ok) {
        const err = await geminiResponse.json();
        throw new Error(err.error?.message || "AI Error");
    }

    const result = await geminiResponse.json();
    const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

    // 4. CHARGE TOKENS
    const usedTokens = result.usageMetadata?.totalTokenCount || (estimateTokens(prompt) + estimateTokens(replyText));
    await chargeAiTokens(session.user.email, usedTokens);

    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ reply: "I'm having trouble connecting right now. Please try again." }, { status: 500 });
  }
}