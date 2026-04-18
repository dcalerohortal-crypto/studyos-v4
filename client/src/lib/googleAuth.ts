import axios from "axios";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI =
  import.meta.env.VITE_REDIRECT_URI ||
  `${window.location.origin}/auth/callback`;

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Generate OAuth URL
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID || "",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange code for tokens — via server-side proxy (no client secret exposed)
export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleTokens | null> {
  try {
    const response = await fetch("/api/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error exchanging code for tokens:", errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    return null;
  }
}

// Refresh access token — via server-side proxy
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokens | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error refreshing token:", errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

// Get user info
export async function getGoogleUser(
  accessToken: string
): Promise<GoogleUser | null> {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}

// API calls using access token
export async function googleCalendarListEvents(
  accessToken: string,
  maxResults = 10
) {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          timeMin: new Date().toISOString(),
          maxResults,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error listing calendar events:", error);
    return null;
  }
}

export async function googleDriveListFiles(accessToken: string, query = "") {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/drive/v3/files",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: query,
          fields: "files(id, name, mimeType, parents)",
          pageSize: 50,
        },
      }
    );
    return response.data.files;
  } catch (error) {
    console.error("Error listing drive files:", error);
    return null;
  }
}

export async function sendGmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
) {
  try {
    const rawEmail = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
    const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await axios.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages.send",
      { raw: encoded },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    return null;
  }
}

// Check if OAuth is configured — only checks client ID (secret is server-side)
export function isGoogleOAuthConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}
