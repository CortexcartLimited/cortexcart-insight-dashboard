import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParams = searchParams.toString();
  const siteId = session.user.email;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'; // Adjust for production

  try {
    // 1. Gather data from your existing internal API endpoints
    const responses = await Promise.all([
      fetch(`${baseUrl}/api/ga4-stats?siteId=${siteId}&${dateParams}`),
      fetch(`${baseUrl}/api/ga4-audience?siteId=${siteId}&${dateParams}`),
      fetch(`${baseUrl}/api/google-ads?siteId=${siteId}&${dateParams}`),
      // Fetch stickiness data for a deeper insight
      fetch(`${baseUrl}/api/ga4-deep-dive?type=stickiness&${dateParams}`),
    ]);

    const data = await Promise.all(
      responses.map(async (res) => {
        if (!res.ok) return null; // Handle failed or empty fetches gracefully
        try { return await res.json(); } catch (e) { return null; }
      })
    );

    const [stats, audience, ads, stickiness] = data;

    // 2. Construct a prompt for Gemini based on the gathered data
    let prompt = `Analyze the following web analytics data and provide 2 brief, actionable recommendations to improve performance. Focus on the most impactful insights.\n\nData Summary:\n`;

    if (stats) {
      prompt += `- Key Metrics: ${stats.users.toLocaleString()} users, ${stats.sessions.toLocaleString()} sessions, ${stats.conversions.toLocaleString()} conversions.\n`;
      prompt += `- Avg Engagement Time: ${(stats.averageEngagementDuration / 60).toFixed(1)} minutes.\n`;
    }
    if (audience) {
      prompt += `- Engagement Rate: ${audience.engagementRate}%.\n`;
      prompt += `- New vs Returning: ${audience.newVsReturning.find(i => i.name === 'new')?.value || 0} new, ${audience.newVsReturning.find(i => i.name === 'returning')?.value || 0} returning.\n`;
    }
    if (stickiness) {
      prompt += `- User Stickiness: DAU/MAU is ${(stickiness.dauPerMau * 100).toFixed(1)}%, DAU/WAU is ${(stickiness.dauPerWau * 100).toFixed(1)}%.\n`;
    }
    if (ads && ads.advertiserAdClicks) {
      const ctr = ((parseInt(ads.advertiserAdClicks) / parseInt(ads.advertiserAdImpressions)) * 100).toFixed(2);
      const cpc = (parseFloat(ads.advertiserAdCost) / parseInt(ads.advertiserAdClicks)).toFixed(2);
      prompt += `- Google Ads: ${parseInt(ads.advertiserAdClicks).toLocaleString()} clicks, ${parseInt(ads.advertiserAdImpressions).toLocaleString()} impressions.\n`;
      prompt += `- Ads Performance: CTR is ${ctr}%, CPC is $${cpc}.\n`;
    } else {
      prompt += `- Google Ads data is not available or not linked.\n`;
    }

    prompt += `\nFormat the response as a single paragraph. Do not use bullet points. Be concise.`;

    // 3. Call the Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 4. Return the recommendation as a structured alert object
    const recommendationAlert = {
      id: 'ai-insight-' + Date.now(),
      type: 'ai-recommendation', // Matches the new type in AlertBanner.js
      title: 'AI-Powered Insights & Recommendations',
      message: responseText || "No specific recommendations at this time based on the available data.",
    };

    return NextResponse.json(recommendationAlert);

  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    // Don't return an error alert, just return null so nothing is shown
    return NextResponse.json(null);
  }
}