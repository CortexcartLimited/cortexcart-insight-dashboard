import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Get the aggregated data that the frontend will send
        let aggregatedData = {};
        try {
            aggregatedData = await request.json();
        } catch {
            console.warn("No aggregated data provided in the request body, proceeding with empty data.");
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // This is our "Smart Prompt" that tells the AI exactly what to do
        const prompt = `
            You are a professional marketing data analyst named Cortex an AI from CortexCart. Your tone is expert, insightful, and encouraging.
            You have been given a JSON object with marketing data.

            Your Task:
            1. Provide a concise "Overall Performance Summary".
            2. Analyze the data to identify 2-3 "Key Successes".
            3. Analyze the data to identify 2-3 "Areas for Improvement".
            4. Based on everything, provide three actionable "Recommendations".
            5. Generate the data for two charts: a bar chart for "Sales By Day" and a line chart for "Mailchimp Audience Growth".
            6. Provide a brief "Explanation" for each chart.
            7. Write a "Concluding Thought".

            Output Format:
            You MUST return your response as a single, valid JSON object. Do not include markdown backticks like \`\`\`json. The structure must be:
            {
              "written_report": {
                "summary": "Your summary here (use markdown).",
                "successes": ["Success 1 text.", "Success 2 text."],
                "improvements": ["Improvement 1 text.", "Improvement 2 text."],
                "recommendations": ["Recommendation 1 text.", "Recommendation 2 text.", "Recommendation 3 text."],
                "conclusion": "Your conclusion here."
              },
              "charts": [
                {
                  "chart_title": "Sales By Day",
                  "chart_type": "bar",
                  "chart_data": { 
                      "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                      "datasets": [{ "label": "Revenue", "data": [15, 25, 40, 30, 55, 10, 14.85] }] 
                  },
                  "explanation": "This chart shows total revenue for each day of the week."
                },
                {
                  "chart_title": "Mailchimp Audience Growth (Last 30 Days)",
                  "chart_type": "line",
                  "chart_data": { /* Generate labels and datasets for audience growth */ },
                  "explanation": "This chart shows new subscribers vs. unsubscribes over the last 30 days."
                }
              ]
            }

            Here is the marketing data:
            ${JSON.stringify(aggregatedData)}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean the response to ensure it's valid JSON
        const cleanedJsonString = responseText.replace(/```json|```/g, '').trim();
        const reportJson = JSON.parse(cleanedJsonString);

        return NextResponse.json(reportJson);

    } catch (error) {
        console.error("AI Report Generation Error:", error);
        return NextResponse.json({ message: 'Failed to generate AI report.' }, { status: 500 });
    }
}