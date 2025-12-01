import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';
import { checkAiLimit, chargeAiTokens, estimateTokens } from '@/lib/ai-limit';


export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;
// 1. CHECK LIMIT
    const limitCheck = await checkAiLimit(session.user.email);
    if (!limitCheck.allowed) {
        // Return null or a specific "Upgrade" alert object
        return NextResponse.json({
            id: 'ai-limit',
            type: 'warning',
            title: 'AI Analysis Paused',
            message: 'You have reached your monthly AI token limit. Upgrade to restore insights.'
        });
    }
    try {
        // --- Cooldown Logic ---
        const [lastReport] = await db.query(
            `SELECT created_at FROM analysis_reports 
             WHERE user_email = ? AND report_type = 'product' 
             ORDER BY created_at DESC LIMIT 1`,
            [userEmail]
        );

        if (lastReport.length > 0) {
            const lastReportTime = new Date(lastReport[0].created_at);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (lastReportTime > twentyFourHoursAgo) {
                return NextResponse.json({ message: 'You can generate one product report per day. Please try again later.' }, { status: 429 });
            }
        }
        // --- END OF COOLDOWN LOGIC ---

        // Find underperforming products
        const productStatsQuery = `
            SELECT productId, productName, SUM(CASE WHEN event_name = 'pageview' THEN 1 ELSE 0 END) AS views
            FROM (
                SELECT JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.productId')) AS productId,
                       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.productName')) AS productName,
                       event_name
                FROM events
                WHERE site_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.type')) = 'product'
            ) AS product_events
            GROUP BY productId, productName
            HAVING SUM(CASE WHEN event_name = 'sale' THEN 1 ELSE 0 END) = 0 AND views > 5
            ORDER BY views DESC LIMIT 3;
        `;
        const [products] = await db.query(productStatsQuery, [userEmail]);

        if (products.length === 0) {
            return NextResponse.json({ message: "No underperforming products found to analyze." }, { status: 200 });
        }

        const prompt = `As an e-commerce copywriter, suggest a new "productName" and a brief "productDescription" (max 20 words) for these products: ${JSON.stringify(products)}. Your response MUST be a valid JSON object array.`;
        
        // --- FIX: Correctly use the 'prompt' variable in the Gemini API call ---
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
        // 2. CHARGE TOKENS
        const usedTokens = result.usageMetadata?.totalTokenCount || (estimateTokens(prompt) + estimateTokens(rawText));
        await chargeAiTokens(session.user.email, usedTokens);
        const result = await geminiResponse.json();

        if (result.candidates && result.candidates.length > 0) {
            // --- FIX: Remove unused 'reportResult' variable ---
            // Just insert the report to log the timestamp for the cooldown.
            await db.query(
                'INSERT INTO analysis_reports (user_email, report_type) VALUES (?, ?)',
                [userEmail, 'product']
            );
            
            const rawText = result.candidates[0].content.parts[0].text;
            const jsonText = rawText.replace(/```json|```/g, '').trim();
            const analysisData = JSON.parse(jsonText);
            return NextResponse.json(analysisData, { status: 200 });
        } else {
            throw new Error('No content received from the AI model.');
        }

    } catch (error) {
        console.error('Error in product analysis API:', error);
        return NextResponse.json({ message: error.message || 'An internal error occurred.' }, { status: 500 });
    }
}
