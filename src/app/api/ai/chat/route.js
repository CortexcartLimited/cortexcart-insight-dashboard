import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { message, context } = await req.json();

    // 1. Construct a Context-Aware System Prompt
    // We stringify the context data (revenue, clicks, etc.) so the AI can "read" it.
    const systemPrompt = `
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

    // 2. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ 
      reply: "I encountered an error analyzing your data. Please check your API limits or try again." 
    }, { status: 500 });
  }
}