import { AIResponse } from "@/types";
import { chatWithGemini, ChatOptions } from "./geminiService";
import { chatWithGroq } from "./groqService";
import { chatWithOllama, checkOllamaAvailable } from "./ollamaService";

export type AIProvider = "ollama" | "gemini" | "groq";

export interface APIClientOptions {
  preferProvider?: AIProvider;
  maxTokens?: number;
  temperature?: number;
  onProviderChange?: (provider: AIProvider) => void;
  onRetrying?: (
    provider: AIProvider,
    attempt: number,
    maxRetries: number
  ) => void;
  onFallback?: (from: AIProvider, to: AIProvider) => void;
  useTools?: boolean;
}

const DEFAULT_OPTIONS: Required<APIClientOptions> = {
  preferProvider: "ollama",
  maxTokens: 8192,
  temperature: 0.7,
  onProviderChange: () => {},
  onRetrying: () => {},
  onFallback: () => {},
  useTools: false,
};

export async function chatWithAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  systemPrompt?: string,
  options: APIClientOptions = {}
): Promise<AIResponse & { provider: AIProvider; toolCalls?: any[] }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: string = "";
  let usedProvider: AIProvider | null = null;
  let retryCount = 0;

  const providers: AIProvider[] =
    opts.preferProvider === "ollama"
      ? ["ollama", "gemini", "groq"]
      : opts.preferProvider === "gemini"
        ? ["gemini", "groq", "ollama"]
        : ["groq", "gemini", "ollama"];

  for (const provider of providers) {
    try {
      console.log(`🤖 API: Intentando con ${provider.toUpperCase()}...`);
      opts.onProviderChange?.(provider);

      let response: AIResponse & { toolCalls?: any[] };

      if (provider === "ollama") {
        const ollamaAvailable = await checkOllamaAvailable();
        if (!ollamaAvailable) {
          console.log("⚠️ Ollama: No disponible, probando siguiente...");
          opts.onFallback?.(
            "ollama",
            providers[providers.indexOf(provider) + 1] || "gemini"
          );
          continue;
        }

        const tools = opts.useTools ? undefined : undefined;
        response = await chatWithOllama(messages, userMessage, systemPrompt);
      } else if (provider === "gemini") {
        response = await chatWithGemini(messages, userMessage, systemPrompt, {
          temperature: opts.temperature,
          maxTokens: opts.maxTokens,
        });
      } else {
        response = await chatWithGroq(messages, userMessage, systemPrompt);
      }

      usedProvider = provider;

      if (response.success && (response.text || response.toolCalls)) {
        console.log(`✅ API: Respuesta exitosa de ${provider.toUpperCase()}`);
        return { ...response, provider };
      }

      if (response.error) {
        lastError = response.error;
        console.warn(`⚠️ API: ${provider} falló: ${response.error}`);
      }

      if (provider === "ollama" && response.error?.includes("disponible")) {
        console.log("🔄 API: Ollama no disponible, probando siguiente...");
        opts.onFallback?.("ollama", "gemini");
        continue;
      }

      if (
        response.error?.includes("429") ||
        response.error?.includes("503") ||
        response.error?.includes("Rate limit") ||
        response.error?.includes("ocupado") ||
        response.error?.includes("vacía")
      ) {
        retryCount++;
        console.log(
          `🔄 API: ${provider} con problemas, reintentando (${retryCount}/3)...`
        );
        opts.onRetrying?.(provider, retryCount, 3);
        continue;
      }

      if (provider === "gemini" && response.error?.includes("no configurada")) {
        console.log("🔄 API: Gemini no disponible, probando Groq...");
        opts.onFallback?.("gemini", "groq");
        continue;
      }

      if (provider === "groq" && !response.success) {
        lastError = response.error || "Groq falló";
        continue;
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Error desconocido";
      lastError = error;
      console.error(`❌ API: Error con ${provider}:`, error);
      continue;
    }
  }

  console.error("❌ API: Todos los providers fallaron");
  return {
    success: false,
    error: lastError || "Todos los proveedores de IA fallaron",
    provider: usedProvider || "ollama",
  };
}

export async function chatWithAITools(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  systemPrompt?: string,
  options: APIClientOptions = {}
): Promise<AIResponse & { provider: AIProvider; toolCalls?: any[] }> {
  const opts = { ...DEFAULT_OPTIONS, ...options, useTools: true };
  let lastError: string = "";
  let usedProvider: AIProvider | null = null;

  const providers: AIProvider[] =
    opts.preferProvider === "ollama"
      ? ["ollama", "gemini", "groq"]
      : opts.preferProvider === "gemini"
        ? ["gemini", "groq", "ollama"]
        : ["groq", "gemini", "ollama"];

  for (const provider of providers) {
    try {
      console.log(`🤖 API Tools: Intentando con ${provider.toUpperCase()}...`);
      opts.onProviderChange?.(provider);

      let response: AIResponse & { toolCalls?: any[] };

      if (provider === "ollama") {
        const ollamaAvailable = await checkOllamaAvailable();
        if (!ollamaAvailable) {
          console.log("⚠️ Ollama: No disponible, probando siguiente...");
          continue;
        }

        const { getTutorTools } = await import("./ollamaService");
        response = await chatWithOllama(
          messages,
          userMessage,
          systemPrompt,
          getTutorTools()
        );
      } else {
        response = await chatWithAI(messages, userMessage, systemPrompt, opts);
        continue;
      }

      usedProvider = provider;

      if (response.success) {
        console.log(
          `✅ API Tools: Respuesta exitosa de ${provider.toUpperCase()}`
        );
        return { ...response, provider };
      }

      if (response.error) {
        lastError = response.error;
        console.warn(`⚠️ API Tools: ${provider} falló: ${response.error}`);
      }

      if (provider === "ollama" && response.error?.includes("disponible")) {
        continue;
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Error desconocido";
      lastError = error;
      console.error(`❌ API Tools: Error con ${provider}:`, error);
      continue;
    }
  }

  console.error("❌ API Tools: Todos los providers fallaron");
  return {
    success: false,
    error: lastError || "Todos los proveedores de IA fallaron",
    provider: usedProvider || "ollama",
  };
}

export async function generateWithAI(
  prompt: string,
  systemPrompt?: string,
  options?: APIClientOptions
): Promise<AIResponse & { provider: AIProvider }> {
  return chatWithAI([], prompt, systemPrompt, options);
}

export function isProviderAvailable(provider: AIProvider): boolean {
  if (provider === "ollama") {
    return true;
  }
  if (provider === "gemini") {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (provider === "groq") {
    return !!import.meta.env.VITE_GROQ_API_KEY;
  }
  return false;
}

export function getAvailableProviders(): AIProvider[] {
  const available: AIProvider[] = ["ollama"];
  if (isProviderAvailable("gemini")) available.push("gemini");
  if (isProviderAvailable("groq")) available.push("groq");
  return available;
}
