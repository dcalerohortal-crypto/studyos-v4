import { AIResponse } from "@/types";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 2000;

interface GeminiError {
  code?: number;
  message?: string;
  status?: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function chatWithGemini(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  systemPrompt?: string,
  options: ChatOptions = {}
): Promise<AIResponse> {
  const { temperature = 0.7, maxTokens = 4096 } = options;

  console.log("🔍 Gemini: Iniciando petición...");
  console.log("🔑 API Key presente:", !!GEMINI_API_KEY);

  if (!GEMINI_API_KEY) {
    console.error("❌ Gemini: API key no configurada");
    return {
      success: false,
      error: "Gemini API key no configurada. Añade VITE_GEMINI_API_KEY en .env",
    };
  }

  let lastError: string = "";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(
          `⏳ Gemini: Reintentando en ${delay}ms (intento ${attempt + 1}/${MAX_RETRIES})...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const contents = [
        ...messages,
        { role: "user" as const, content: userMessage },
      ];

      const requestBody = {
        contents: contents.map(msg => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
        systemInstruction: systemPrompt
          ? { parts: [{ text: systemPrompt }] }
          : undefined,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      };

      const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
      console.log(`📡 Gemini: Enviando petición (intento ${attempt + 1})...`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Gemini: Respuesta recibida, status:", response.status);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: GeminiError;
        };
        const errorMsg =
          errorData?.error?.message ||
          errorData?.error?.status ||
          `HTTP ${response.status}`;

        lastError = `Error de Gemini: ${errorMsg}`;

        if (response.status === 429 || response.status === 503) {
          console.warn(
            `⚠️ Gemini: Rate limit (${response.status}), reintentando...`
          );
          continue;
        }

        console.error("❌ Gemini: Error HTTP", response.status, errorMsg);
        return { success: false, error: lastError };
      }

      const data = await response.json();
      console.log("✅ Gemini: Datos recibidos");

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.finishReason === "STOP"
          ? data?.candidates?.[0]?.content?.parts?.[0]?.text
          : "";

      if (!text) {
        console.warn("⚠️ Gemini: Respuesta vacía, reintentando...");
        lastError = "Gemini devolvió respuesta vacía";
        continue;
      }

      return { success: true, text };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Error de conexión";
      lastError = `Error al conectar con Gemini: ${error}`;
      console.error(`❌ Gemini error (intento ${attempt + 1}):`, error);

      if (attempt < MAX_RETRIES - 1) {
        continue;
      }
    }
  }

  console.error("❌ Gemini: Todos los intentos fallidos");
  return { success: false, error: lastError };
}

export async function generateWithGemini(
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  return chatWithGemini([], prompt, systemPrompt, {
    temperature: 0.7,
    maxTokens: 8192,
  });
}
