import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { checkAiLimit, chargeAiTokens, estimateTokens } from '@/lib/ai-limit';

async function fetchPageContent(url) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        const response = await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 25000 
        });

        if (!response || !response.ok()) {
            throw new Error(`Failed to load page. Status: ${response ? response.status() : 'Unknown'}`);
        }

        return await page.content();

    } catch (error) {
        console.error(`Puppeteer Error fetching ${url}:`, error);
        throw new Error(`Could not access ${url}. The site may be blocking bots.`);
    } finally {
        if (browser) await browser.close();
    }
}

// Helper to map string confidence to a float (0.0 - 1.0)
const getConfidenceScore = (val) => {
    const v = String(val).toLowerCase();
    if (v.includes('high')) return 0.9;
    if (v.includes('medium')) return 0.6;
    if (v.includes('low')) return 0.3;
    return 0.5; // Default fallback
};

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session.user.email;

    // 1. CHECK AI LIMIT (Replaces Cooldown)
    const limitCheck = await checkAiLimit(userEmail);
    if (!limitCheck.allowed) {
        return NextResponse.json({ message: limitCheck.error }, { status: 403 });
    }

    const connection = await db.getConnection();

    try {
        // Fetch Site URL
        const [rows] = await connection.query('SELECT site_url FROM sites WHERE user_email = ?', [userEmail]);
        const siteUrl = rows[0]?.site_url;
        if (!siteUrl) {
            throw new Error('Site URL not found. Please set it in Settings.');
        }

        // Fetch HTML
        const htmlContent = await fetchPageContent(siteUrl);
        
        // Clean HTML to save tokens
        const cleanHtml = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                                     .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                                     .substring(0, 15000);

        const prompt = `
            As an expert CRO consultant, analyze this homepage HTML.
            Focus on: SEO, Performance, and Copywriting.
            Return a valid JSON object with keys: "seo", "performance", "copywriting".
            Each key contains an array of objects: { "recommendation": "...", "confidence": "High/Medium/Low" }.
            HTML:
            \`\`\`html
            ${cleanHtml}
            \`\`\`
        `;
        
        // Call Gemini API
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const apiKey = process.env.GEMINI_API_KEY; // Using your correct variable name
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const geminiResponse = await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (!geminiResponse.ok) {
            const err = await geminiResponse.json();
            throw new Error(err.error?.message || 'AI Model Failed');
        }
        
        const result = await geminiResponse.json();
        
        if (result.candidates && result.candidates.length > 0) {
            const rawText = result.candidates[0].content.parts[0].text;
            const jsonText = rawText.replace(/```json|```/g, '').trim();
            const analysisData = JSON.parse(jsonText);

            // 2. CHARGE TOKENS
            const usedTokens = estimateTokens(prompt) + estimateTokens(rawText);
            await chargeAiTokens(userEmail, usedTokens);

            // Save results
            await connection.beginTransaction();

            const [reportResult] = await connection.query(
                'INSERT INTO analysis_reports (user_email, report_type) VALUES (?, ?)',
                [userEmail, 'homepage']
            );
            const reportId = reportResult.insertId;

            for (const [category, recommendations] of Object.entries(analysisData)) {
                if (Array.isArray(recommendations)) {
                    for (const rec of recommendations) {
                        // FIX: Convert confidence string to number
                        const score = getConfidenceScore(rec.confidence);

                        await connection.query(
                            'INSERT INTO recommendation_items (report_id, category, recommendation, confidence) VALUES (?, ?, ?, ?)',
                            [reportId, category, rec.recommendation, score]
                        );
                    }
                }
            }
            
            await connection.query(
                'INSERT INTO notifications (user_email, message, link) VALUES (?, ?, ?)',
                [userEmail, 'Your new Homepage Analysis Report is ready.', '/recommendations']
            );

            await connection.commit();
            
            return NextResponse.json({ message: 'Analysis complete.', reportId: reportId }, { status: 200 });
        } else {
            throw new Error('No content received from AI.');
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Homepage Analysis Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}