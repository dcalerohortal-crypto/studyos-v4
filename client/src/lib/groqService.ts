import { AIResponse, Rutina } from "@/types";

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
  console.log("🔍 Groq: Enviando petición via proxy...");

  try {
    const response = await fetch("/api/ai-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        userMessage,
        systemPrompt: systemPrompt || SYSTEM_INSTRUCTION,
        provider: "groq",
        options: { temperature: 0.7, maxTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = (errorData as any)?.error || `HTTP ${response.status}`;
      console.error("❌ Groq proxy error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    console.log("✅ Groq: Respuesta recibida via proxy");

    if (data.success && data.text) {
      // Intentar parsear rutina si existe
      const rutina = parseRutinaFromResponse(data.text) || undefined;
      return { success: true, text: data.text, rutina };
    }

    return data;
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
