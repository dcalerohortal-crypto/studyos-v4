import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

interface ProxyRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
  systemPrompt?: string;
  provider: "gemini" | "groq";
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

async function callGemini(
  messages: Array<{ role: string; content: string }>,
  userMessage: string,
  systemPrompt?: string,
  options?: { temperature?: number; maxTokens?: number }
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Gemini API key no configurada en el servidor" };
  }

  const { temperature = 0.7, maxTokens = 4096 } = options || {};

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const contents = [
        ...messages,
        { role: "user" as const, content: userMessage },
      ];

      const requestBody = {
        contents: contents.map((msg) => ({
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

      const url = `${GEMINI_API_URL}?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          (errorData as any)?.error?.message ||
          (errorData as any)?.error?.status ||
          `HTTP ${response.status}`;

        if (response.status === 429 || response.status === 503) {
          continue;
        }
        return { success: false, error: `Error de Gemini: ${errorMsg}` };
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) {
        continue;
      }

      return { success: true, text };
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) continue;
      return {
        success: false,
        error: `Error al conectar con Gemini: ${err instanceof Error ? err.message : "Error desconocido"}`,
      };
    }
  }

  return { success: false, error: "Gemini: Todos los intentos fallidos" };
}

async function callGroq(
  messages: Array<{ role: string; content: string }>,
  userMessage: string,
  systemPrompt?: string,
  options?: { temperature?: number; maxTokens?: number }
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Groq API key no configurada en el servidor" };
  }

  const { temperature = 0.7, maxTokens = 2048 } = options || {};

  try {
    const contents = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt || "" },
          ...contents,
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        (errorData as any)?.error?.message || `HTTP ${response.status}`;
      return { success: false, error: `Error de Groq: ${errorMsg}` };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";

    if (!text) {
      return { success: false, error: "Groq no devolvió respuesta" };
    }

    return { success: true, text };
  } catch (err) {
    return {
      success: false,
      error: `Error al conectar con Groq: ${err instanceof Error ? err.message : "Error desconocido"}`,
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, userMessage, systemPrompt, provider, options } =
      req.body as ProxyRequest;

    if (!userMessage && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: "userMessage es requerido" });
    }

    let result;

    if (provider === "groq") {
      result = await callGroq(messages || [], userMessage, systemPrompt, options);
    } else {
      // Default to gemini
      result = await callGemini(messages || [], userMessage, systemPrompt, options);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("AI Proxy error:", err);
    return res.status(500).json({
      success: false,
      error: `Error interno del proxy: ${err instanceof Error ? err.message : "Error desconocido"}`,
    });
  }
}
