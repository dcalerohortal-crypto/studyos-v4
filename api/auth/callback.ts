import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, redirect_uri } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Google OAuth not configured on server" });
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect_uri || process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/callback",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Google token exchange error:", errorData);
      return res.status(response.status).json({
        error: (errorData as any)?.error_description || "Failed to exchange code for tokens",
      });
    }

    const tokens = await response.json();
    return res.status(200).json(tokens);
  } catch (err) {
    console.error("Token exchange error:", err);
    return res.status(500).json({
      error: `Token exchange failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}
