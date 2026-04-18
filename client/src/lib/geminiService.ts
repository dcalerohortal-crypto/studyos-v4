import { AIResponse } from "@/types";

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

  console.log("🔍 Gemini: Enviando petición via proxy...");

  try {
    const response = await fetch("/api/ai-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        userMessage,
        systemPrompt,
        provider: "gemini",
        options: { temperature, maxTokens },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = (errorData as any)?.error || `HTTP ${response.status}`;
      console.error("❌ Gemini proxy error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    console.log("✅ Gemini: Respuesta recibida via proxy");
    return data;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Error de conexión";
    console.error("❌ Gemini error:", error);
    return { success: false, error: `Error al conectar con Gemini: ${error}` };
  }
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
