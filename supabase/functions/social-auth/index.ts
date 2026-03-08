import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const platform = url.searchParams.get("platform") || "unknown";
  const origin = url.searchParams.get("origin") || "*";

  // Platform display configs
  const platformConfig: Record<string, { color: string; icon: string; name: string }> = {
    google: { color: "#4285F4", icon: "G", name: "Google" },
    apple: { color: "#000000", icon: "🍎", name: "Apple" },
    x: { color: "#000000", icon: "𝕏", name: "X (Twitter)" },
    twitter: { color: "#000000", icon: "𝕏", name: "X (Twitter)" },
    discord: { color: "#5865F2", icon: "🎮", name: "Discord" },
    telegram: { color: "#0088cc", icon: "✈️", name: "Telegram" },
    github: { color: "#333333", icon: "🐙", name: "GitHub" },
  };

  const config = platformConfig[platform.toLowerCase()] || { color: "#00E5FF", icon: "🔗", name: platform };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect ${config.name} — CHOICE ID</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #111;
      border: 1px solid #222;
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      background: ${config.color}22;
      border: 2px solid ${config.color}44;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin: 0 auto 24px;
    }
    h1 { font-size: 22px; font-weight: 900; margin-bottom: 8px; letter-spacing: -0.5px; }
    p { color: #888; font-size: 14px; margin-bottom: 32px; line-height: 1.5; }
    .brand { color: #00E5FF; }
    .btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: ${config.color};
      color: #fff;
      margin-bottom: 12px;
    }
    .btn-primary:hover { opacity: 0.9; transform: scale(0.98); }
    .btn-cancel {
      background: transparent;
      color: #666;
      border: 1px solid #333;
    }
    .btn-cancel:hover { border-color: #555; color: #999; }
    .success { display: none; }
    .success .check {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 16px;
    }
    .success h2 { font-size: 20px; font-weight: 900; margin-bottom: 8px; }
    .success p { color: #10b981; }
  </style>
</head>
<body>
  <div class="card">
    <div id="connect-view">
      <div class="icon">${config.icon}</div>
      <h1>Connect ${config.name}</h1>
      <p>Link your ${config.name} account to your <span class="brand">CHOICE ID</span> to build your verifiable social reputation.</p>
      <button class="btn btn-primary" onclick="authorize()">Authorize ${config.name}</button>
      <button class="btn btn-cancel" onclick="window.close()">Cancel</button>
    </div>
    <div class="success" id="success-view">
      <div class="check">✓</div>
      <h2>Connected!</h2>
      <p>${config.name} linked to your CHOICE ID</p>
    </div>
  </div>
  <script>
    function authorize() {
      document.getElementById('connect-view').style.display = 'none';
      document.getElementById('success-view').style.display = 'block';

      const payload = {
        type: 'AUTH_SUCCESS',
        platform: '${platform}',
        displayName: '${config.name}',
        handle: '${config.name.toLowerCase()}_user_' + Math.random().toString(36).substring(2, 8),
        verified: true,
        timestamp: Date.now()
      };

      if (window.opener) {
        window.opener.postMessage(payload, '${origin}');
      }

      setTimeout(() => window.close(), 1200);
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});
