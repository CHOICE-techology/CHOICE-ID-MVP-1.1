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

    const prompt = `You are a social media analytics engine. Given the platform "${platform}" and profile handle "${handle}" (URL: ${profileUrl}), provide a realistic social reputation analysis.

Return ONLY valid JSON with these exact fields:
{
  "platform": "${platform}",
  "handle": "${handle}",
  "verified": true,
  "followers": <number between 100-500000 based on platform norms>,
  "posts": <number between 10-5000>,
  "comments": <number>,
  "sector": "<one of: Web3 Development, Digital Art & NFT, DeFi Finance, Blockchain Marketing, AI Research, Community Management, Content Creation, Software Engineering, Entrepreneurship>",
  "mission": "<one sentence about what this profile seems focused on>",
  "engagementRate": "<percentage like 3.5%>",
  "botProbability": "<percentage like 2.1%>",
  "behaviorScore": "<one of: Organic / High Authority, Organic / Moderate Authority, Mixed Signals, Low Activity>"
}

Make the analysis realistic based on the platform type and handle. Different platforms have different norms for follower counts and engagement.`;

    const aiRes = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`AI Gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Ensure required fields
    analysis.platform = platform;
    analysis.handle = handle;
    analysis.verified = true;

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Social analysis error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
