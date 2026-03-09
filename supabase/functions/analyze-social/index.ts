import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, profileUrl } = await req.json();
    if (!platform || !profileUrl) {
      return new Response(JSON.stringify({ error: 'Platform and profileUrl required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Extract handle from URL
    const urlParts = profileUrl.replace(/\/$/, '').split('/');
    const handle = urlParts[urlParts.length - 1]?.replace('@', '') || 'unknown';

    const prompt = `You are an elite social media reputation analysis engine, inspired by Favikon. 
Given the platform "${platform}" and profile handle "${handle}" (URL: ${profileUrl}), provide a comprehensive, realistic social reputation analysis.

Return ONLY valid JSON with these exact fields (no markdown, no explanation):
{
  "platform": "${platform}",
  "handle": "${handle}",
  "verified": true,
  "followers": <realistic number based on platform and handle, 100-500000>,
  "posts": <realistic post count 10-5000>,
  "comments": <estimated comment count>,
  "sector": "<one of: Web3 Development, Digital Art & NFT, DeFi Finance, Blockchain Marketing, AI Research, Community Management, Content Creation, Software Engineering, Entrepreneurship, Finance & Investment>",
  "mission": "<one sentence describing the profile's apparent focus and purpose>",
  "engagementRate": "<percentage like 3.5%>",
  "botProbability": "<percentage like 2.1%>",
  "behaviorScore": "<one of: Organic / High Authority, Organic / Moderate Authority, Mixed Signals, Low Activity>",
  "platformScore": <overall platform reputation score 0-100, integer>,
  "influence": <authority/reach score 0-100 integer, based on followers and verified connections>,
  "engagement": <engagement quality score 0-100 integer, based on real interaction rate>,
  "consistency": <posting consistency score 0-100 integer, based on post frequency and quality>,
  "authenticity": <anti-bot/anti-fake score 0-100 integer, inverse of bot probability>,
  "community": <community contribution score 0-100 integer, based on comments and replies>,
  "insights": [
    "<short actionable insight about this specific profile's strength or weakness>",
    "<another insight>"
  ],
  "growthTrend": "<one of: Rising, Stable, Declining>",
  "audienceQuality": "<one of: Premium, Good, Average, Poor>"
}

Scoring guidelines:
- platformScore: weighted average of all sub-scores
- influence: based on followers relative to platform norms (LinkedIn 5k = 70, Twitter 10k = 60, etc.)
- engagement: engagement rate >5% = 90+, 2-5% = 60-80, <2% = 20-50
- consistency: >500 posts = 90+, 100-500 = 60-80, <100 = 20-50
- authenticity: botProbability <5% = 90+, 5-15% = 70-80, >15% = <60
- community: high comment count relative to followers = high score
- Make analysis realistic for the specific platform and inferred content type from handle
- Different platforms have very different engagement norms`;

    const aiRes = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) throw new Error('Rate limit reached. Please try again in a moment.');
      if (aiRes.status === 402) throw new Error('AI credits required. Please check your workspace usage.');
      throw new Error(`AI Gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    let analysis: any;
    try {
      analysis = JSON.parse(jsonStr.trim());
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Ensure required fields and sanitize
    analysis.platform = platform;
    analysis.handle = handle;
    analysis.verified = true;

    // Clamp all numeric scores to 0-100
    for (const key of ['platformScore', 'influence', 'engagement', 'consistency', 'authenticity', 'community']) {
      if (typeof analysis[key] === 'number') {
        analysis[key] = Math.max(0, Math.min(100, Math.round(analysis[key])));
      }
    }

    // Ensure insights is an array
    if (!Array.isArray(analysis.insights)) {
      analysis.insights = [];
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Social analysis error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
