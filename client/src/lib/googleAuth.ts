import axios from "axios";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  import.meta.env.VITE_REDIRECT_URI ||
  "http://localhost:3000/api/auth/callback";

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

interface GoogleUser {
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

// Exchange code for tokens
export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleTokens | null> {
  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    });

    return response.data;
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    return null;
  }
}

// Refresh access token
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokens | null> {
  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    return response.data;
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
    const response = await axios.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages.send",
      {
        raw: Buffer.from(
          `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`
        ).toString("base64url"),
      },
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

// Check if OAuth is configured
export function isGoogleOAuthConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}
