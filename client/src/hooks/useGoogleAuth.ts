import { useState, useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  isGoogleOAuthConfigured,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getGoogleUser,
  GoogleUser,
} from "@/lib/googleAuth";

interface GoogleAuthState {
  isConnected: boolean;
  isLoading: boolean;
  user: GoogleUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  error: string | null;
}

const DEFAULT_STATE: GoogleAuthState = {
  isConnected: false,
  isLoading: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  error: null,
};

export function useGoogleAuth() {
  const [auth, setAuth] = useLocalStorage<GoogleAuthState>(
    "studyos_google_auth",
    DEFAULT_STATE
  );
  const [error, setError] = useState<string | null>(null);

  // Check if OAuth is configured
  const isConfigured = isGoogleOAuthConfigured();

  // Connect to Google
  const connect = useCallback(async () => {
    if (!isConfigured) {
      setError(
        "Google OAuth no está configurado. Añade las credenciales en las variables de entorno."
      );
      return;
    }

    // Abrir OAuth en popup
    const authUrl = getGoogleAuthUrl();
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2 + window.screenX;
    const top = (window.innerHeight - height) / 2 + window.screenY;

    const popup = window.open(
      authUrl,
      "Google OAuth",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Esperar callback con el code
    return new Promise<string | null>(resolve => {
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          resolve(null);
        }
      }, 500);

      // Listen for callback via postMessage
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "google_oauth_code") {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);

          const exchangeTokens = async () => {
            setAuth(prev => ({ ...prev, isLoading: true }));

            const tokens = await exchangeCodeForTokens(event.data.code);

            if (tokens) {
              const userInfo = await getGoogleUser(tokens.access_token);

              setAuth({
                isConnected: true,
                isLoading: false,
                user: userInfo,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: Date.now() + tokens.expires_in * 1000,
                error: null,
              });

              resolve(tokens.access_token);
            } else {
              setError("Error al obtener tokens");
              resolve(null);
            }
          };

          exchangeTokens();
        }
      };

      window.addEventListener("message", handleMessage);
    });
  }, [isConfigured, setAuth]);

  // Disconnect from Google
  const disconnect = useCallback(() => {
    setAuth(DEFAULT_STATE);
  }, [setAuth]);

  // Ensure valid access token
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!auth.accessToken || !auth.refreshToken) {
      return null;
    }

    // Check if token is expired
    if (auth.expiresAt && Date.now() > auth.expiresAt - 60000) {
      // Refresh the token
      const newTokens = await refreshAccessToken(auth.refreshToken);

      if (newTokens) {
        setAuth(prev => ({
          ...prev,
          accessToken: newTokens.access_token,
          expiresAt: Date.now() + newTokens.expires_in * 1000,
        }));
        return newTokens.access_token;
      } else {
        // Refresh failed, disconnect
        disconnect();
        return null;
      }
    }

    return auth.accessToken;
  }, [auth, setAuth, disconnect]);

  // Auto-refresh token on mount
  useEffect(() => {
    if (auth.isConnected && auth.refreshToken) {
      getValidToken();
    }
  }, []);

  return {
    isConnected: auth.isConnected,
    isLoading: auth.isLoading,
    user: auth.user,
    isConfigured,
    error: error || auth.error,
    connect,
    disconnect,
    getValidToken,
  };
}
