import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, context } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY; // Make sure this matches your .env name

    if (!apiKey) {
      return NextResponse.json({ reply: "AI is not configured (Missing API Key)." }, { status: 500 });
    }

    // 1. Construct the System Prompt
    // We combine the role, context, and user question into one prompt string.
    const prompt = `
      You are Cortexcart's AI Business Analyst. You are talking to an e-commerce business owner.
      
      HERE IS THE USER'S LIVE DASHBOARD DATA:
      ${JSON.stringify(context, null, 2)}
      
      RULES:
      1. Answer the user's question based strictly on the data above.
      2. If the data is missing for a specific metric, say "I don't see that data currently."
      3. Be concise, professional, and actionable.
      4. If the user asks "Why did sales drop?", look for correlations in the data (e.g., lower traffic, lower ad spend).
      
      USER QUESTION: "${message}"
    `;

    // 2. Call the Gemini API (Direct Fetch)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
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
      throw new Error(errorData.error?.message || 'Failed to get a response from AI.');
    }

    const result = await geminiResponse.json();

    // 3. Parse the Response
    if (result.candidates && result.candidates.length > 0) {
      const replyText = result.candidates[0].content.parts[0].text;
      return NextResponse.json({ reply: replyText });
    } else {
      throw new Error('No content received from the AI model.');
    }

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ 
      message: `Server Error: ${error.message}` 
    }, { status: 500 });
  }
}