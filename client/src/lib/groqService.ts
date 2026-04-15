import { AIResponse, Rutina } from "@/types";

// Groq API - Gratuito y rápido
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "gsk_test_key";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_INSTRUCTION = `Eres el asistente IA de StudyOS, una app de estudio y desarrollo personal para un estudiante de 16 años en 4º ESO en Madrid, España.

REGLAS:
- Responde siempre en español
- Sé directo, sin rodeos, sin suavizar la realidad
- Respuestas concisas pero completas
- Sin "¡Genial!", "¡Perfecto!" ni entusiasmo artificial
- Usa analogías de fútbol, tecnología, dinero y vida cotidiana de un chico de 16 años
- Si hay fórmulas matemáticas, usa LaTeX entre $ $ o $$ $$
- Nunca inventes datos ni estadísticas sin confirmarlos

CAPACIDADES:
- Puedes generar rutinas de estudio, ejercicio, salud y desarrollo personal
- Puedes ayudar con cualquier asignatura de 4º ESO (Mates, Física, Química, Lengua, Inglés, Historia)
- Puedes dar consejos de productividad y hábitos

FORMATO DE RUTINAS:
Cuando te pidan crear una rutina, responde con este formato JSON exacto envuelto en \`\`\`json ... \`\`\`:
\`\`\`json
{
  "tipo": "rutina",
  "nombre": "Nombre corto de la rutina",
  "categoria": "deporte|estudio|salud|mente",
  "duracion": "30 min",
  "metodologia": "Nombre de la metodología usada",
  "pasos": [
    "Paso 1: descripción",
    "Paso 2: descripción"
  ]
}
\`\`\`
Después del JSON, añade una explicación breve de por qué esta metodología funciona.`;

export async function chatWithGroq(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  systemPrompt?: string
): Promise<AIResponse> {
  console.log("🔍 Groq: Iniciando petición...");
  console.log(
    "🔑 API Key presente:",
    !!GROQ_API_KEY,
    GROQ_API_KEY ? `(${GROQ_API_KEY.substring(0, 10)}...)` : ""
  );

  if (!GROQ_API_KEY || GROQ_API_KEY === "gsk_test_key") {
    console.error("❌ Groq: API key no configurada");
    return {
      success: false,
      error: "Groq API key no configurada. Añade VITE_GROQ_API_KEY en .env",
    };
  }

  const contents = [
    ...messages,
    { role: "user" as const, content: userMessage },
  ];

  try {
    console.log("📡 Groq: Enviando petición a", GROQ_API_URL);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt || SYSTEM_INSTRUCTION },
          ...contents,
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    console.log("📥 Groq: Respuesta recibida, status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        (errorData as { error?: { message?: string } })?.error?.message ||
        `HTTP ${response.status}`;
      console.error("❌ Groq: Error HTTP", response.status, errorMsg);
      return { success: false, error: `Error de Groq: ${errorMsg}` };
    }

    const data = await response.json();
    console.log("✅ Groq: Datos recibidos");
    const text = data?.choices?.[0]?.message?.content || "";

    if (!text) {
      console.error("❌ Groq: No devolvió texto");
      return { success: false, error: "Groq no devolvió respuesta" };
    }

    // Intentar parsear rutina si existe
    const rutina = parseRutinaFromResponse(text) || undefined;

    return { success: true, text, rutina };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Error de conexión";
    console.error("❌ Groq error:", error);
    return { success: false, error: `Error al conectar con Groq: ${error}` };
  }
}

export function parseRutinaFromResponse(text: string): Rutina | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;

  try {
    const data = JSON.parse(jsonMatch[1]);
    if (data.tipo !== "rutina") return null;

    return {
      id: `rutina_${Date.now()}`,
      nombre: data.nombre || "Rutina sin nombre",
      tipo: data.categoria || "estudio",
      pasos: data.pasos || [],
      duracion: data.duracion || "30 min",
      metodologia: data.metodologia || "Personalizada",
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function cleanResponseText(text: string): string {
  return text.replace(/```json[\s\S]*?```\n?/g, "").trim();
}
