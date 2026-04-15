import { GeneratedContent, PodcastSegment, PodcastScript } from "@/types";
import { chatWithGroq } from "./groqService";

export type PodcastFormat =
  | "detailed"
  | "brief"
  | "critical"
  | "debate"
  | "tutorial"
  | "entrevista"
  | "tecnico";
export type PodcastLanguage = "es" | "en" | "ca" | "gl" | "eu";

export interface PodcastConfig {
  format: PodcastFormat;
  language: PodcastLanguage;
  duration: number;
  focus: string;
}

export interface PodcastResult {
  audioUrl: string;
  script: PodcastScript;
}

const FORMAT_PROMPTS: Record<
  PodcastFormat,
  { system: string; segments: string }
> = {
  detailed: {
    system: `<ROL>
Eres un experto en crear podcasts educativos detallados tipo NotebookLM.
</ROL>

<INSTRUCCIONES>
1. Genera un diálogo conversacional entre dos presentadores (host1 y host2)
2. Explora el tema en profundidad, conectando conceptos entre sí
3. Usa analogías y ejemplos cotidianos para explicar ideas complejas
4. Incluye datos específicos, citas o cifras del contenido original cuando estén disponibles
5. Finaliza con una reflexión o pregunta abierta para el oyente
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma que el usuario especificó</IDIOMA>`,
    segments: `<NÚMERO_SEGMENTOS>
Calcula el número óptimo de segmentos según la duración solicitada:
- 2 min → 4-6 segmentos
- 5 min → 6-10 segmentos
- 10 min → 10-14 segmentos
- 15 min → 14-18 segmentos
- 20+ min → 18-24 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. INTRO (1 segmento): Saludo energetic y presentación del tema
2. CONTEXTO (1-2 segmentos): Por qué es importante este tema
3. DESARROLLO (3-6 segmentos): Explicación profunda con ejemplos
4. CONEXIONES (1-2 segmentos): Cómo se relaciona con otros conceptos
5. CIERRE (1 segmento): Reflexión final o pregunta para pensar
</ESTRUCTURA>

<ESTILO>
- Tono: Entusiasta pero informativo
- Lenguaje: Accesible, evita jerga sin explicar
- Transiciones: Usa frases como "Esto nos lleva a...", "Otro punto interesante..."
</ESTILO>`,
  },
  brief: {
    system: `<ROL>
Eres un experto en crear podcasts breves y concisos tipo resumen ejecutivo.
</ROL>

<INSTRUCCIONES>
1. Ve directo al grano, sin preámbulos innecesarios
2. Cada segmento debe aportar información nueva o profundizar brevemente
3. Usa frases cortas y contundentes
4. Elimina todo lo que no sea esencial
5. Cierra con la idea principal o un dato memorable
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma que el usuario especificó</IDIOMA>`,
    segments: `<NÚMERO_SEGMENTOS>
- 2 min → 4-5 segmentos (muy conciso)
- 5 min → 6-8 segmentos
- 10 min → 10-12 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. HOOK (1 segmento): Frase impactante o dato sorprendente sobre el tema
2. IDEAS CLAVE (3-5 segmentos): Los 3-5 puntos más importantes, uno por segmento
3. CIERRE (1-2 segmentos): Conclusión o dato memorable
</ESTRUCTURA>

<ESTILO>
- Tono: Dinámico, casi telegráfico
- Lenguaje: Muy directo, sin florituras
- Transiciones: Mínimas, solo las esenciales
</ESTILO>`,
  },
  critical: {
    system: `<ROL>
Eres un experto en análisis crítico educativo tipo revisor académico.
</ROL>

<INSTRUCCIONES>
1. Los dos presentadores tienen perspectivas diferentes pero construtivas
2. Cuestiona supuestos, identifica limitaciones y puntos fuertes del contenido
3. Usa evidencia del texto para respaldar críticas constructivas
4. Compara con otras fuentes o perspectivas cuando sea relevante
5. Evita ser destructivo: todo análisis debe ser construtivo
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma que el usuario especificó</IDIOMA>`,
    segments: `<NÚMERO_SEGMENTOS>
- 5 min → 8-10 segmentos
- 10 min → 12-16 segmentos
- 15 min → 16-20 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. INTRO CRÍTICA (1-2 segmentos): Presentación del tema y primeras impresiones
2. ANÁLISIS (4-8 segmentos): Análisis punto por punto con evidencia
3. EVALUACIÓN (2-3 segmentos): Qué funciona bien, qué podría mejorar
4. PERSPECTIVA (1-2 segmentos): Cómo se compara con el estado del arte
5. CIERRE (1 segmento): Veredicto final balanced
</ESTRUCTURA>

<ESTILO>
- Tono: Profesional pero accesible, nunca condescendiente
- Lenguaje: Preciso, usa términos técnicos con explicación
- Transiciones: "Dicho esto...", "Sin embargo...", "Por otro lado..."
</ESTILO>`,
  },
  debate: {
    system: `<ROL>
Eres un experto en crear debates animados entre dos presentadores con perspectivas opuestas.
</ROL>

<INSTRUCCIONES>
1. Host1 defiende/apoya el contenido, host2 lo cuestiona o presenta альтернативную perspectiva
2. Ambos deben argumentar con lógica y evidencia
3. Incluye puntos donde el otro tiene razón y lo reconocen
4. El debate debe ser intelectualmente honesto, no performativo
5. Termina con una síntesis o reconocimiento mutuo de complejidad
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma que el usuario especificó</IDIOMA>`,
    segments: `<NÚMERO_SEGMENTOS>
- 5 min → 10-12 segmentos (más cortas, más intercambios)
- 10 min → 14-18 segmentos
- 15 min → 18-24 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. POSICIONES (2-3 segmentos): Cada uno presenta su postura inicial
2. ARGUMENTOS (6-12 segmentos): Intercambio de argumentos y contraargumentos
3. PUNTOS DE ENCUENTRO (2-3 segmentos): Dónde coinciden trotzdem
4. SÍNTESIS (1-2 segmentos): Intento de convergencia o reconocimiento de complejidad
</ESTRUCTURA>

<ESTILO>
- Tono: Passionate but respectful
- Lenguaje: Declarativo, asertivo
- Transiciones: "Pero...", "Eso no es del todo cierto porque...", "Estoy de acuerdo en que..."
</ESTILO>`,
  },
  tutorial: {
    system: `<ROL>
Eres un experto en crear tutorials educativos paso a paso.
</ROL>

<INSTRUCCIONES>
1. Host1 es el profesor/explicador, host2 hace de estudiante curioso
2. Explica CADA paso con suficiente detalle para que alguien sin conocimiento previo lo entienda
3. Usa ejemplos progresivos: de simple a complejo
4. Anticípate a preguntas frecuentes y respóndelas
5. Incluye ejercicios o preguntas de verificación cuando tenga sentido
6. Al final, resume los pasos aprendidos
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma que el usuario especificó</IDIOMA>`,
    segments: `<NÚMERO_SEGMENTOS>
- 5 min → 8-10 segmentos
- 10 min → 12-16 segmentos
- 15 min → 16-22 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. OBJETIVO (1-2 segmentos): Qué sabrá/fará el oyente al final
2. PRE-REQUISITOS (1 segmento): Qué necesita saber o tener preparado
3. PASO A PASO (6-14 segmentos): Cada concepto importante como un "paso"
4. EJEMPLO PRÁCTICO (2-3 segmentos): Aplicación real del concepto
5. RESUMEN (1-2 segmentos): Repaso de lo aprendido
</ESTRUCTURA>

<ESTILO>
- Tono: Paciente, methodical, encouraging
- Lenguaje: Claro, con check-ins como "¿entiendes?" o "esto es importante"
- Transiciones: "Ahora vamos a...", "El siguiente paso es...", "Bien, ahora que sabes esto..."
</ESTILO>`,
  },
  entrevista: {
    system: `<ROL>
Eres un experto en crear podcasts tipo entrevista sobre temas educativos.
</ROL>

<INSTRUCCIONES>
1. Host2 es el "experto" en el tema (el contenido que proporcionaste)
2. Host1 es el entrevistador curioso que guía la conversación
3. Las preguntas deben sonar naturales, no artificiales
4. El entrevistador hace preguntas de seguimiento lógicas
5. El experto da respuestas completas pero no excesivamente largas
6. Incluye preguntas que el oyente也想ía hacer
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma que el usuario especificó</IDIOMA>`,
    segments: `<NÚMERO_SEGMENTOS>
- 5 min → 8-10 segmentos
- 10 min → 12-16 segmentos
- 15 min → 16-22 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. PRESENTACIÓN (1-2 segmentos): Host1 presenta al "experto" y el tema
2. CONTEXTO (2-3 segmentos): Preguntas sobre el panorama general
3. CONTENIDO PRINCIPAL (6-12 segmentos): La meat del tema
4. PREGUNTAS ESPECÍFICAS (2-4 segmentos): Casos concretos o ejemplos
5. CIERRE (1-2 segmentos): Síntesis final y despedida
</ESTRUCTURA>

<ESTILO>
- Tono: Natural, como una conversación real
- Lenguaje: Entrevistador hace preguntas cortas, experto responde con profundidad
- Transiciones: "Cuéntame más sobre...", "Antes de continuar, una pregunta...", "Para resumir lo que dices..."
</ESTILO>`,
  },
  tecnico: {
    system: `<ROL>
Eres un experto en crear contenido técnico-académico de alto nivel.
</ROL>

<INSTRUCCIONES>
1. Supón un público con conocimientos previos en el área
2. Usa terminología técnica apropiadamente (pero aún accesible)
3. Incluye detalles específicos: fórmulas, fechas, datos, nombres
4. Relaciona con conceptos avanzados o teorías subyacentes
5. Compara con enfoques alternativos o el estado del arte
6. Sé preciso: no simplifiques en exceso ni generalices incorrectamente
</INSTRUCCIONES>

<IDIOMA>Responde siempre en el idioma que el usuario especificó</IDIOMA>`,
    segments: `<NÚMERO_SEGMENTOS>
- 5 min → 6-8 segmentos (cada uno más denso)
- 10 min → 10-14 segmentos
- 15 min → 14-18 segmentos
</NÚMERO_SEGMENTOS>

<ESTRUCTURA>
1. CONTEXTO TÉCNICO (1-2 segmentos): Marco teórico o supuestos
2. DESARROLLO TÉCNICO (5-10 segmentos): Explicación profunda con detalles
3. ANÁLISIS COMPARATIVO (2-3 segmentos): Comparación con alternativas
4. IMPLICACIONES (1-2 segmentos): Por qué es relevante, aplicaciones
5. CONCLUSIÓN (1 segmento): Síntesis técnica precisa
</ESTRUCTURA>

<ESTILO>
- Tono: Profesional, preciso
- Lenguaje: Técnico pero explicativo, assume some background knowledge
- Transiciones: "Desde la perspectiva de...", "Técnicamente hablando...", "Esto se fundamenta en..."
</ESTILO>`,
  },
};

const LANGUAGE_LABELS: Record<PodcastLanguage, string> = {
  es: "español",
  en: "inglés",
  ca: "catalán",
  gl: "gallego",
  eu: "euskera",
};

function getSegmentCount(
  duration: number,
  format: PodcastFormat
): { min: number; max: number } {
  const formatConfig = FORMAT_PROMPTS[format];

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
  if (duration <= 5) {
    if (format === "tutorial" || format === "entrevista")
      return { min: 8, max: 10 };
    if (format === "critical") return { min: 8, max: 10 };
    return { min: 6, max: 10 };
  }
  if (duration <= 10) {
    if (format === "tutorial" || format === "entrevista")
      return { min: 12, max: 16 };
    if (format === "critical") return { min: 12, max: 16 };
    return { min: 10, max: 14 };
  }
  if (format === "tutorial" || format === "entrevista")
    return { min: 16, max: 22 };
  if (format === "critical") return { min: 16, max: 20 };
  return { min: 14, max: 18 };
}

export async function generatePodcastScript(
  documentText: string,
  notebookName: string,
  config: PodcastConfig
): Promise<PodcastScript | null> {
  try {
    const { system, segments: segmentInstructions } =
      FORMAT_PROMPTS[config.format];
    const lang = LANGUAGE_LABELS[config.language];
    const { min, max } = getSegmentCount(config.duration, config.format);
    const segmentCount = Math.floor((min + max) / 2);

    const systemPrompt = `${system}

<CONTEXTO>
Tema del podcast: ${notebookName}
Idioma del podcast: ${lang}
Duración estimada: ${config.duration} minutos
${config.focus ? `Enfoque específico: ${config.focus}` : "Enfoque: General, cubre todo el contenido disponible"}

${segmentInstructions}

<NÚMERO_OBLIGATORIO>
El podcast debe tener EXACTAMENTE entre ${min} y ${max} segmentos. Intenta estar en el rango medio: ~${segmentCount} segmentos.
</NÚMERO_OBLIGATORIO>

<FORMATO_JSON>
\`\`\`json
{
  "segments": [
    {"speaker": "host1", "text": "Texto del presentador 1"},
    {"speaker": "host2", "text": "Texto del presentador 2"},
    ...
  ]
}
\`\`\`
</FORMATO_JSON>

<REGLAS_ABSOLUTAS>
1. Usa SOLO "host1" y "host2" como nombres de presentadores
2. Cada segmento es UNA intervención (2-4 frases máximo, salvo en formatos técnicos donde puede ser un poco más largo)
3. Devuelve SOLO el JSON, sin texto antes o después
4. Los textos deben ser completos y bien escritos
5. El podcast debe sonar natural cuando se lea en voz alta
</REGLAS_ABSOLUTAS>`;

    const userContent = `CONTENIDO FUENTE PARA EL PODCAST:
${documentText}`;

    const response = await chatWithGroq(
      [{ role: "user", content: userContent }],
      "",
      systemPrompt
    );

    if (!response.success || !response.text) {
      throw new Error("No se pudo generar el guión del podcast");
    }

    let jsonStr = response.text;
    const jsonMatch = response.text.match(
      /```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/
    );
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[2];
    } else {
      const braceStart = response.text.indexOf("{");
      const braceEnd = response.text.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd !== -1) {
        jsonStr = response.text.substring(braceStart, braceEnd + 1);
      }
    }

    const parsed = JSON.parse(jsonStr);

    if (
      !parsed.segments ||
      !Array.isArray(parsed.segments) ||
      parsed.segments.length === 0
    ) {
      throw new Error("El guión del podcast está vacío o malformado");
    }

    return {
      segments: parsed.segments.map((seg: PodcastSegment, idx: number) => ({
        speaker:
          seg.speaker === "host1" || seg.speaker === "host2"
            ? seg.speaker
            : idx % 2 === 0
              ? "host1"
              : "host2",
        text: seg.text || "",
      })),
    };
  } catch (error) {
    console.error("Error generating podcast script:", error);
    return null;
  }
}

const HF_API_URL = "/api/tts";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function generateAudioSegment(
  text: string,
  attempt: number = 1
): Promise<ArrayBuffer> {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (response.status === 503 || response.status === 400) {
    if (attempt < MAX_RETRIES) {
      console.log(
        `Modelo cargando, esperando ${RETRY_DELAY_MS}ms... Intento ${attempt}/${MAX_RETRIES}`
      );
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return generateAudioSegment(text, attempt + 1);
    }
    throw new Error("Modelo no disponible después de múltiples intentos");
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Error: ${response.status}`;
    }
    throw new Error(`Error en API TTS: ${errorMessage}`);
  }

  return response.arrayBuffer();
}

export async function generatePodcastAudio(
  script: PodcastSegment[],
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    const audioChunks: ArrayBuffer[] = [];
    const totalSegments = script.length;

    for (let i = 0; i < script.length; i++) {
      const segment = script[i];

      const audioBuffer = await generateAudioSegment(segment.text);
      audioChunks.push(audioBuffer);

      if (onProgress) {
        onProgress(((i + 1) / totalSegments) * 100);
      }
    }

    const totalLength = audioChunks.reduce(
      (acc, buf) => acc + buf.byteLength,
      0
    );
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    const blob = new Blob([combined], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(blob);

    return audioUrl;
  } catch (error) {
    console.error("Error generating podcast audio:", error);
    throw error;
  }
}

export async function generatePodcast(
  documentText: string,
  notebookName: string,
  config: PodcastConfig,
  onProgress?: (stage: string, progress: number) => void
): Promise<GeneratedContent | null> {
  try {
    onProgress?.("Generando guión...", 10);

    const script = await generatePodcastScript(
      documentText,
      notebookName,
      config
    );
    if (!script || script.segments.length === 0) {
      throw new Error("No se pudo generar el guión del podcast");
    }

    onProgress?.("Generando audio...", 40);

    const audioUrl = await generatePodcastAudio(
      script.segments,
      audioProgress => {
        onProgress?.("Generando audio...", 40 + audioProgress * 0.6);
      }
    );

    if (!audioUrl) {
      throw new Error("No se pudo generar el audio del podcast");
    }

    const formatLabels: Record<PodcastFormat, string> = {
      detailed: "Detallado",
      brief: "Breve",
      critical: "Crítico",
      debate: "Debate",
      tutorial: "Tutorial",
      entrevista: "Entrevista",
      tecnico: "Técnico",
    };

    return {
      id: `podcast_${Date.now()}`,
      type: "podcast",
      title: `${formatLabels[config.format]}: ${notebookName}`,
      content: {
        audioUrl,
        script,
        config,
      },
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating podcast:", error);
    return null;
  }
}
