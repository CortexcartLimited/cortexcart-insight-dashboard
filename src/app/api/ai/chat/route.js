import { NextResponse } from 'next/server';

export async function POST(req) {
  console.log("🤖 AI Chat Request Received"); // Debug Log 1

  try {
    const { message, context } = await req.json();
    
    // 1. Check API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("❌ Critical: Missing API Key in Environment Variables");
      return NextResponse.json({ reply: "Configuration Error: API Key missing." }, { status: 500 });
    }

    // 2. Construct Prompt
    const prompt = `
      You are Cortexcart's AI Business Analyst.
      CONTEXT DATA: ${JSON.stringify(context)}
      USER QUESTION: "${message}"
      Keep the answer concise and helpful.
    `;

    console.log("📤 Sending request to Gemini..."); // Debug Log 2

    // 3. Call Gemini API (Direct REST)
    // Using 'gemini-1.5-flash' as it is often faster/cheaper/more stable than 'gemini-pro'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("🔥 Gemini API Error:", JSON.stringify(errorData, null, 2)); // Critical Error Log
      throw new Error(errorData.error?.message || `API Status: ${geminiResponse.status}`);
    }

    const result = await geminiResponse.json();
    console.log("✅ Gemini Response Received"); // Debug Log 3

    if (result.candidates && result.candidates.length > 0) {
      const replyText = result.candidates[0].content.parts[0].text;
      return NextResponse.json({ reply: replyText });
    } else {
      throw new Error('No content in Gemini response candidates.');
    }

  } catch (error) {
    console.error('🔥 Server Handler Error:', error);
    return NextResponse.json({ 
      reply: "I'm having trouble thinking right now. (Check server logs for details)" 
    }, { status: 500 });
  }
}