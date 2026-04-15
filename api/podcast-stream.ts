import { PodcastConfig, PodcastSegment } from "./podcast-jobs";

export type PodcastFormat =
  | "detailed"
  | "brief"
  | "critical"
  | "debate"
  | "tutorial"
  | "entrevista"
  | "tecnico";

const FORMAT_SYSTEM_PROMPTS: Record<PodcastFormat, string> = {
  detailed: `<ROL>Eres un experto en crear podcasts educativos detallados tipo NotebookLM.</ROL>

<INSTRUCCIONES>
1. Genera un diálogo conversacional entre dos presentadores (host1 y host2)
2. Explora el tema en profundidad, conectando conceptos
3. Usa analogías y ejemplos cotidianos
4. Incluye datos específicos del contenido original
5. Finaliza con una reflexión o pregunta abierta
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma especificado</IDIOMA>`,

  brief: `<ROL>Eres un experto en crear podcasts breves y concisos tipo resumen ejecutivo.</ROL>

<INSTRUCCIONES>
1. Ve directo al grano, sin preámbulos
2. Cada segmento debe aportar información nueva
3. Usa frases cortas y contundentes
4. Cierra con la idea principal
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma especificado</IDIOMA>`,

  critical: `<ROL>Eres un experto en análisis crítico educativo.</ROL>

<INSTRUCCIONES>
1. Dos presentadores con perspectivas diferentes pero constructivas
2. Cuestiona supuestos, identifica limitaciones
3. Usa evidencia del texto
4. Evita ser destructivo: todo análisis debe ser constructivo
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma especificado</IDIOMA>`,

  debate: `<ROL>Eres un experto en crear debates animados entre dos presentadores con perspectivas opuestas.</ROL>

<INSTRUCCIONES>
1. Host1 defensa/apoya el contenido, host2 lo cuestiona
2. Ambos deben argumentar con lógica y evidencia
3. Incluye puntos donde el otro tiene razón
4. El debate debe ser intelectualmente honesto
5. Termina con una síntesis o reconocimiento mutuo
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma especificado</IDIOMA>

<FORMATO_DOS_VOCES>
Para el formato debate, DEBES generar el guión con formato JSON estructurado que permita asignar diferentes voces TTS:
- Host1 usa voz masculina (ej: "af_heart", "am_fen")
- Host2 usa voz femenina (ej: "af_sarah", "af_nova")
El JSON debe incluir el campo "voice" para cada segmento:
{"segments": [{"speaker": "host1", "voice": "am_fen", "text": "..."}, {"speaker": "host2", "voice": "af_sarah", "text": "..."}]}
</FORMATO_DOS_VOCES>`,

  tutorial: `<ROL>Eres un experto en crear tutorials educativos paso a paso.</ROL>

<INSTRUCCIONES>
1. Host1 es el profesor, host2 hace de estudiante curioso
2. Explica CADA paso con suficiente detalle
3. Usa ejemplos progresivos
4. Anticípate a preguntas frecuentes
5. Al final, resume los pasos aprendidos
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma especificado</IDIOMA>`,

  entrevista: `<ROL>Eres un experto en crear podcasts tipo entrevista.</ROL>

<INSTRUCCIONES>
1. Host2 es el "experto" en el tema
2. Host1 es el entrevistador curioso
3. Las preguntas deben sonar naturales
4. El entrevistador hace preguntas de seguimiento
5. El experto da respuestas completas pero no excesivamente largas
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma especificado</IDIOMA>`,

  tecnico: `<ROL>Eres un experto en crear contenido técnico-académico de alto nivel.</ROL>

<INSTRUCCIONES>
1. Supón un público con conocimientos previos
2. Usa terminología técnica apropiada
3. Incluye detalles específicos: fórmulas, fechas, datos
4. Relaciona con conceptos avanzados
5. Sé preciso: no simplifiques en exceso
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma especificado</IDIOMA>`,
};

const SEGMENT_INSTRUCTIONS: Record<PodcastFormat, string> = {
  detailed: `<NÚMERO_SEGMENTOS>
- 2 min → 4-6 segmentos
- 5 min → 6-10 segmentos
- 10 min → 10-14 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. INTRO: Saludo enérgico y presentación
2. CONTEXTO: Por qué es importante
3. DESARROLLO: Explicación profunda con ejemplos
4. CIERRE: Reflexión final
</ESTRUCTURA>`,

  brief: `<NÚMERO_SEGMENTOS>
- 2 min → 4-5 segmentos
- 5 min → 6-8 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. HOOK: Frase impactante
2. IDEAS CLAVE: Los 3-5 puntos más importantes
3. CIERRE: Conclusión memorable
</ESTRUCTURA>`,

  critical: `<NÚMERO_SEGMENTOS>
- 5 min → 8-10 segmentos
- 10 min → 12-16 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. INTRO CRÍTICA: Primeras impresiones
2. ANÁLISIS: Análisis punto por punto
3. EVALUACIÓN: Qué funciona bien, qué podría mejorar
4. CIERRE: Veredicto final balanceado
</ESTRUCTURA>`,

  debate: `<NÚMERO_SEGMENTOS>
- 5 min → 10-12 segmentos
- 10 min → 14-18 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. POSICIONES: Cada uno presenta su postura
2. ARGUMENTOS: Intercambio de argumentos
3. PUNTOS DE ENCUENTRO: Dónde coinciden
4. SÍNTESIS: Reconocimiento de complejidad
</ESTRUCTURA>`,

  tutorial: `<NÚMERO_SEGMENTOS>
- 5 min → 8-10 segmentos
- 10 min → 12-16 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. OBJETIVO: Qué sabrá hacer el oyente
2. PRE-REQUISITOS: Qué necesita saber
3. PASO A PASO: Cada concepto como un paso
4. RESUMEN: Repaso de lo aprendido
</ESTRUCTURA>`,

  entrevista: `<NÚMERO_SEGMENTOS>
- 5 min → 8-10 segmentos
- 10 min → 12-16 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. PRESENTACIÓN: Presentación del experto
2. CONTEXTO: Preguntas sobre el panorama general
3. CONTENIDO PRINCIPAL: La meat del tema
4. CIERRE: Síntesis y despedida
</ESTRUCTURA>`,

  tecnico: `<NÚMERO_SEGMENTOS>
- 5 min → 6-8 segmentos
- 10 min → 10-14 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. CONTEXTO TÉCNICO: Marco teórico
2. DESARROLLO TÉCNICO: Explicación profunda
3. ANÁLISIS COMPARATIVO: Comparación con alternativas
4. CONCLUSIÓN: Síntesis técnica precisa
</ESTRUCTURA>`,
};

function getSegmentCount(
  duration: number,
  format: PodcastFormat
): { min: number; max: number } {
  if (format === "brief") {
    if (duration <= 2) return { min: 4, max: 5 };
    if (duration <= 5) return { min: 6, max: 8 };
    return { min: 10, max: 12 };
  }
  if (format === "debate") {
    if (duration <= 5) return { min: 10, max: 12 };
    if (duration <= 10) return { min: 14, max: 18 };
    return { min: 18, max: 24 };
  }
  if (format === "tecnico") {
    if (duration <= 5) return { min: 6, max: 8 };
    if (duration <= 10) return { min: 10, max: 14 };
    return { min: 14, max: 18 };
  }
  if (duration <= 2) return { min: 4, max: 6 };
  if (duration <= 5) return { min: 6, max: 10 };
  if (duration <= 10) return { min: 10, max: 14 };
  return { min: 14, max: 18 };
}

function getVoiceForSpeaker(speaker: string, format: PodcastFormat): string {
  if (format === "debate" || format === "entrevista") {
    return speaker === "host1" ? "am_fen" : "af_sarah";
  }
  if (format === "tutorial") {
    return speaker === "host1" ? "af_sarah" : "am_fen";
  }
  return "af_sarah";
}

export function buildDynamicPrompt(
  documentText: string,
  notebookName: string,
  config: PodcastConfig
): { system: string; user: string } {
  const format = config.format as PodcastFormat;
  const systemBase =
    FORMAT_SYSTEM_PROMPTS[format] || FORMAT_SYSTEM_PROMPTS.detailed;
  const segmentInstructions =
    SEGMENT_INSTRUCTIONS[format] || SEGMENT_INSTRUCTIONS.detailed;

  const { min, max } = getSegmentCount(config.duration, format);
  const segmentCount = Math.floor((min + max) / 2);

  const languageLabels: Record<string, string> = {
    ES: "español",
    EN: "English",
    CA: "català",
    GL: "galego",
    EU: "euskera",
  };
  const lang = languageLabels[config.language] || "español";

  const systemPrompt = `${systemBase}

<CONTEXTO>
Tema: ${notebookName}
Idioma: ${lang}
Duración: ${config.duration} minutos
${config.focus ? `Enfoque: ${config.focus}` : "Enfoque: General"}
</CONTEXTO>

${segmentInstructions}

<NÚMERO_OBLIGATORIO>
El podcast debe tener entre ${min} y ${max} segmentos (~${segmentCount} idealmente)
</NÚMERO_OBLIGATORIO>

<FACTOR_VOZ>
Formato "${format}" usa dos voces:
- host1: ${getVoiceForSpeaker("host1", format)}
- host2: ${getVoiceForSpeaker("host2", format)}
</FACTOR_VOZ>

<FORMATO_JSON>
\`\`\`json
{
  "segments": [
    {"speaker": "host1", "voice": "${getVoiceForSpeaker("host1", format)}", "text": "Texto del presentador 1..."},
    {"speaker": "host2", "voice": "${getVoiceForSpeaker("host2", format)}", "text": "Texto del presentador 2..."}
  ]
}
\`\`\`
</FORMATO_JSON>

<REGLAS_ABSOLUTAS>
1. Usa SOLO "host1" y "host2" como nombres
2. Cada segmento es UNA intervención (2-4 frases máximo)
3. Devuelve SOLO el JSON, sin texto antes o después
4. Los textos deben sonar naturales al hablar
</REGLAS_ABSOLUTAS>`;

  const userPrompt = `CONTENIDO FUENTE PARA EL PODCAST:
${documentText.substring(0, 12000)}

Genera el guión completo del podcast en formato JSON.`;

  return { system: systemPrompt, user: userPrompt };
}

export async function* generateScriptStream(
  documentText: string,
  notebookName: string,
  config: PodcastConfig
): AsyncGenerator<{
  type: string;
  content?: string;
  segments?: PodcastSegment[];
  done?: boolean;
}> {
  const { system, user } = buildDynamicPrompt(
    documentText,
    notebookName,
    config
  );

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("No API key configured");
  }

  yield { type: "status", content: "Generando guión con IA..." };

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: user }],
        system: system,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              yield { type: "done" };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.delta?.text) {
                fullText += parsed.delta.text;
                yield { type: "chunk", content: parsed.delta.text };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } else {
    // Groq non-streaming fallback
    const response = await fetch("https://api.groq.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = data.choices[0]?.message?.content || "";

    // Simulate streaming
    for (let i = 0; i < text.length; i += 50) {
      yield { type: "chunk", content: text.slice(i, i + 50) };
      await new Promise(r => setTimeout(r, 20));
    }
  }

  yield { type: "done" };
}

export async function generateParsedScript(
  documentText: string,
  notebookName: string,
  config: PodcastConfig
): Promise<PodcastSegment[]> {
  const format = config.format as PodcastFormat;
  const { system, user } = buildDynamicPrompt(
    documentText,
    notebookName,
    config
  );

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("No API key configured");
  }

  let response;

  if (process.env.ANTHROPIC_API_KEY) {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: user }],
        system: system,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = (await response.json()) as {
      content: Array<{ text: string }>;
    };
    const text = data.content[0]?.text || "";

    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed.segments.map(
        (seg: { speaker: string; text: string }, idx: number) => ({
          speaker:
            seg.speaker === "host1" || seg.speaker === "host2"
              ? seg.speaker
              : idx % 2 === 0
                ? "host1"
                : "host2",
          voice: getVoiceForSpeaker(
            seg.speaker === "host1" ? "host1" : "host2",
            format
          ),
          text: seg.text || "",
        })
      );
    }
  } else {
    response = await fetch("https://api.groq.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = data.choices[0]?.message?.content || "";

    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed.segments.map(
        (seg: { speaker: string; text: string }, idx: number) => ({
          speaker:
            seg.speaker === "host1" || seg.speaker === "host2"
              ? seg.speaker
              : idx % 2 === 0
                ? "host1"
                : "host2",
          voice: getVoiceForSpeaker(
            seg.speaker === "host1" ? "host1" : "host2",
            format
          ),
          text: seg.text || "",
        })
      );
    }
  }

  throw new Error("Could not parse script from response");
}
