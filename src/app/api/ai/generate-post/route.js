import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { checkAiLimit, chargeAiTokens, estimateTokens } from '@/lib/ai-limit'; // Import Helper

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
// 1. CHECK LIMIT
    const limitCheck = await checkAiLimit(session.user.email);
    if (!limitCheck.allowed) {
        return NextResponse.json({ message: limitCheck.error }, { status: 403 });
    }
    try {
        const { topic, platform, maxLength } = await request.json();

        if (!topic || !platform) {
            return NextResponse.json({ message: 'A topic and platform are required.' }, { status: 400 });
        }

        // 1. Construct the prompt for the Gemini API
        const prompt = `
            You are a professional social media marketing expert. Your task is to generate a compelling post for the platform "${platform}".
            
            The topic for the post is: "${topic}"

            Follow these rules strictly:
            1. The post's text must be engaging and tailored to a ${platform} audience.
            2. The post's text must NOT exceed ${maxLength} characters.
            3. Suggest between 3 and 5 relevant and popular hashtags.

            Your response MUST be a valid JSON object. Do not include any text, notes, or markdown formatting before or after the JSON object.
            The JSON object should have two keys: "postContent" (a string containing the generated post) and "hashtags" (an array of strings).
        `;

        // 2. Call the Gemini API
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = process.env.GEMINI_API_KEY;
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
            const jsonText = rawText.replace(/```json|```/g, '').trim();
            const analysisData = JSON.parse(jsonText);
            // 2. CHARGE TOKENS
        const usedTokens = result.usageMetadata?.totalTokenCount || (estimateTokens(prompt) + estimateTokens(rawText));
        await chargeAiTokens(session.user.email, usedTokens);
            return NextResponse.json(analysisData, { status: 200 });
        } else {
            throw new Error('No content received from the AI model.');
        }

    } catch (error) {
        console.error('Error in post generation API:', error);
        return NextResponse.json({ message: error.message || 'An internal error occurred.' }, { status: 500 });
    }
}
