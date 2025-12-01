import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { checkAiLimit, chargeAiTokens, estimateTokens } from '@/lib/ai-limit';

// Helper: Fix private key newlines
function formatCredentials(creds) {
    if (creds && creds.private_key) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
    return creds;
}

// Helper: Safe date parsing
function formatDate(dateStr) {
    if (!dateStr) return '28daysAgo';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '28daysAgo';
        return d.toISOString().split('T')[0];
    } catch (e) { return '28daysAgo'; }
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  const { searchParams } = new URL(req.url);
  const startDate = formatDate(searchParams.get('startDate'));
  const endDate = formatDate(searchParams.get('endDate') || 'today');

  try {
    // 1. Get GA4 Credentials from Database directly
    const [rows] = await db.query(
        'SELECT ga4_property_id, credentials_json FROM ga4_connections WHERE user_email = ?',
        [session.user.email]
    );

    if (rows.length === 0 || !rows[0].credentials_json) {
        return NextResponse.json(null);
    }

    const { ga4_property_id, credentials_json } = rows[0];
    
    let credentials;
    try {
        const decrypted = decrypt(credentials_json);
        if (decrypted) credentials = JSON.parse(decrypted);
    } catch (e) {}
    if (!credentials) {
         try { credentials = JSON.parse(credentials_json); } catch (e) { return NextResponse.json(null); }
    }
    credentials = formatCredentials(credentials);

    // 2. Initialize GA4 Client
    const client = new BetaAnalyticsDataClient({ credentials });
    const property = `properties/${ga4_property_id}`;
    const dateRanges = [{ startDate, endDate }];

    // 3. Run All Reports in Parallel
    const [statsRep, audienceRep, adsRep, stickinessRep] = await Promise.all([
        client.runReport({
            property, dateRanges,
            metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'conversions' }, { name: 'userEngagementDuration' }]
        }),
        client.runReport({
            property, dateRanges,
            dimensions: [{ name: 'newVsReturning' }],
            metrics: [{ name: 'activeUsers' }, { name: 'engagementRate' }]
        }),
        client.runReport({
            property, dateRanges,
            dimensions: [{ name: 'sessionCampaignName' }],
            metrics: [{ name: 'advertiserAdClicks' }, { name: 'advertiserAdCost' }, { name: 'advertiserAdImpressions' }]
        }),
        client.runReport({
            property, dateRanges,
            metrics: [{ name: 'dauPerMau' }, { name: 'dauPerWau' }]
        })
    ]);

    // 4. Process Data
    const statsRow = statsRep[0].rows?.[0];
    const users = parseInt(statsRow?.metricValues[0].value || 0);
    const sessions = parseInt(statsRow?.metricValues[1].value || 0);
    const conversions = parseInt(statsRow?.metricValues[2].value || 0);
    const avgTime = parseFloat(statsRow?.metricValues[3].value || 0) / (users || 1);

    let newUsers = 0;
    let returningUsers = 0;
    let engagementRate = 0;
    if (audienceRep[0].rows) {
        audienceRep[0].rows.forEach(r => {
            const type = r.dimensionValues[0].value;
            const count = parseInt(r.metricValues[0].value);
            if (type === 'new') newUsers = count;
            if (type === 'returning') returningUsers = count;
            engagementRate = Math.max(engagementRate, parseFloat(r.metricValues[1].value) * 100); 
        });
    }

    let adClicks = 0;
    let adCost = 0;
    let adImpressions = 0;
    if (adsRep[0].rows) {
        adsRep[0].rows.forEach(r => {
            adClicks += parseInt(r.metricValues[0].value || 0);
            adCost += parseFloat(r.metricValues[1].value || 0);
            adImpressions += parseInt(r.metricValues[2].value || 0);
        });
    }
    const ctr = adImpressions > 0 ? ((adClicks / adImpressions) * 100).toFixed(2) : 0;
    const cpc = adClicks > 0 ? (adCost / adClicks).toFixed(2) : 0;

    const stickRow = stickinessRep[0].rows?.[0];
    const dauMau = (parseFloat(stickRow?.metricValues[0].value || 0) * 100).toFixed(1);

    // 5. Construct Prompt
    let prompt = `Analyze this web analytics data and provide 2 brief, high-impact recommendations.
    
    Data Summary:
    - Traffic: ${users.toLocaleString()} users, ${sessions.toLocaleString()} sessions.
    - Conversions: ${conversions.toLocaleString()}.
    - Engagement: ${engagementRate.toFixed(1)}% engagement rate, ${(avgTime / 60).toFixed(1)} min avg time.
    - Retention: ${newUsers} new vs ${returningUsers} returning users. DAU/MAU stickiness: ${dauMau}%.
    `;

    if (adClicks > 0) {
        prompt += `- Ads: ${adClicks} clicks, ${adImpressions} imps, $${adCost.toFixed(2)} cost. CTR: ${ctr}%, CPC: $${cpc}.\n`;
    } else {
        prompt += `- Ads: No active ad data.\n`;
    }

    prompt += `\nFormat the response as a single paragraph. Focus on growth or fixing low engagement.`;

    // 6. Call Gemini API Directly (Matches your working pattern)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
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
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errorText}`);
    }

    const result = await geminiResponse.json();
    // 2. CHARGE TOKENS
        const usedTokens = result.usageMetadata?.totalTokenCount || (estimateTokens(prompt) + estimateTokens(rawText));
        await chargeAiTokens(session.user.email, usedTokens);
    // Extract text safely
    let responseText = "No recommendations available.";
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content) {
        responseText = result.candidates[0].content.parts[0].text;
    }

    // 7. Return Alert Object
    return NextResponse.json({
      id: 'ai-insight-' + Date.now(),
      type: 'ai-recommendation',
      title: 'AI-Powered Insights & Recommendations',
      message: responseText,
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ 
        error: "AI Generation Failed", 
        details: error.message 
    }, { status: 500 });
  }
}