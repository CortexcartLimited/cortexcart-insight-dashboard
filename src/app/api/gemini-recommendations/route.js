import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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
        // GA4 not connected, cannot generate insights
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

    // 3. Run All Reports in Parallel (Fast & Secure)
    const [statsRep, audienceRep, adsRep, stickinessRep] = await Promise.all([
        // A. General Stats
        client.runReport({
            property, dateRanges,
            metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'conversions' }, { name: 'userEngagementDuration' }]
        }),
        // B. Audience (Engagement & New vs Returning)
        client.runReport({
            property, dateRanges,
            dimensions: [{ name: 'newVsReturning' }],
            metrics: [{ name: 'activeUsers' }, { name: 'engagementRate' }]
        }),
        // C. Ads (Advertiser Metrics broken down by Campaign to avoid incompatibility errors)
        client.runReport({
            property, dateRanges,
            dimensions: [{ name: 'sessionCampaignName' }],
            metrics: [{ name: 'advertiserAdClicks' }, { name: 'advertiserAdCost' }, { name: 'advertiserAdImpressions' }]
        }),
        // D. Stickiness
        client.runReport({
            property, dateRanges,
            metrics: [{ name: 'dauPerMau' }, { name: 'dauPerWau' }]
        })
    ]);

    // 4. Process Data for Gemini
    
    // -- Stats Processing --
    const statsRow = statsRep[0].rows?.[0];
    const users = parseInt(statsRow?.metricValues[0].value || 0);
    const sessions = parseInt(statsRow?.metricValues[1].value || 0);
    const conversions = parseInt(statsRow?.metricValues[2].value || 0);
    const avgTime = parseFloat(statsRow?.metricValues[3].value || 0) / (users || 1);

    // -- Audience Processing --
    let newUsers = 0;
    let returningUsers = 0;
    let engagementRate = 0;
    if (audienceRep[0].rows) {
        audienceRep[0].rows.forEach(r => {
            const type = r.dimensionValues[0].value;
            const count = parseInt(r.metricValues[0].value);
            if (type === 'new') newUsers = count;
            if (type === 'returning') returningUsers = count;
            // Take the max rate found (simplified)
            engagementRate = Math.max(engagementRate, parseFloat(r.metricValues[1].value) * 100); 
        });
    }

    // -- Ads Processing (Summing up campaigns) --
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

    // -- Stickiness Processing --
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

    // 6. Call Gemini
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY env var");
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 7. Return Alert Object
    return NextResponse.json({
      id: 'ai-insight-' + Date.now(),
      type: 'ai-recommendation',
      title: 'AI-Powered Insights & Recommendations',
      message: responseText,
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return debug info if it fails, so you can see it in the Network Tab
    return NextResponse.json({ 
        error: "AI Generation Failed", 
        details: error.message 
    }, { status: 500 });
  }
}