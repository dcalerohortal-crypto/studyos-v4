import {
  GeneratedContent,
  Flashcard,
  TestQuestion,
  StructuredSummary,
  MindmapNode,
  InteractiveMindmap,
} from "@/types";
import { chatWithAI, AIProvider, APIClientOptions } from "./apiClient";

export interface GenerationCallbacks {
  onProviderChange?: (provider: AIProvider) => void;
  onRetrying?: (
    provider: AIProvider,
    attempt: number,
    maxRetries: number
  ) => void;
  onFallback?: (from: AIProvider, to: AIProvider) => void;
}

const USER_CONTEXT = `CONTEXTO DEL USUARIO:
- Edad: 16 años
- Nivel académico: 4º ESO (Educación Secundaria)
- Preparando: EVAU (Evaluación para Acceso a la Universidad)
- Asignaturas clave: Matemáticas II, Física, Tecnología e Ingeniería II (ponderan 0.2 para UC3M)
- Objetivo: 8 de media para Bachillerato de Excelencia
- Estilo de aprendizaje: Gen Z, usa fútbol, tecnología y dinero como analogías`;

const SYSTEM_INSTRUCTION_BASE = `${USER_CONTEXT}

REGLAS DE RESPUESTA:
- Responde SIEMPRE en español
- Sé claro y directo
- Usa vocabulario apropiado para 4º ESO (no muy básico, no muy avanzado)
- Si hay fórmulas matemáticas, usa LaTeX: $...$ para inline y $$...$$ para bloque
- Incluye ejemplos prácticos cuando sea posible`;

function buildFlashcardPrompt(
  documentText: string,
  notebookName: string,
  count: number,
  topicContext?: string
): { system: string; user: string } {
  const systemPrompt = `${SYSTEM_INSTRUCTION_BASE}

ROL: Eres un profesor experto en crear flashcards de estudio efectivas para estudiantes de 4º ESO preparando EVAU.

OBJETIVO: Generar exactamente ${count} flashcards de alta calidad sobre "${notebookName}".

TIPO DE CONTENIDO:
- El texto contiene información sobre ${notebookName}
- Necesitas cubrir TODOS los conceptos importantes del material
- Cada flashcard debe ser independiente y tener sentido por sí sola

REGLAS ESTRICTAS:
1. Genera EXACTAMENTE ${count} flashcards (ni más, ni menos)
2. Cada flashcard tiene:
   - front: LA PREGUNTA (concisa, específica, clara)
   - back: LA RESPUESTA (completa pero concisa, puede incluir fórmulas LaTeX)
3. La pregunta (front) debe:
   - Ser una pregunta directa, no una frase incompleta
   - Usar "¿Qué es...?", "¿Por qué...?", "¿Cómo...?", etc.
   - NO ser genérica como "¿Cuál es el concepto clave?"
   - Refereirse a información específica del texto
4. La respuesta (back) debe:
   - Ser la respuesta directa a la pregunta
   - Incluir la definición/explicación clara
   - Usar LaTeX para fórmulas: $E = mc^2$ inline, $$\\int_0^1 x dx$$ bloque
   - Incluir ejemplos si es relevante

EJEMPLOS DE BUENAS FLASHCARDS:
front: "¿Qué es la fotosíntesis?"
back: "Proceso por el cual las plantas convierten $CO_2 + H_2O$ en $glucosa + O_2$ usando luz solar. Ecuación: $6CO_2 + 6H_2O \\xrightarrow{\\text{luz}} C_6H_{12}O_6 + 6O_2$"

front: "¿Cuál es el dominio de la función $f(x) = \\frac{1}{x-2}$?"
back: "Todos los números reales excepto $x = 2$, ya que dividir entre cero no está definido. En notación de intervalos: $(-\\infty, 2) \\cup (2, +\\infty)$"

front: "¿Qué dice la Segunda Ley de Newton?"
back: "La aceleración de un cuerpo es directamente proporcional a la fuerza neta aplicada e inversamente proporcional a su masa. Fórmula: $\\vec{F} = m \\cdot \\vec{a}$"

FORMATOS MATEMÁTICOS:
- Números: Usa notación estándar ($3.14$, no 3,14)
- Fracciones: $\\frac{a}{b}$ o $a/b$
- Potencias: $x^2$, $2^{10}$
- Raíces: $\\sqrt{x}$, $\\sqrt[3]{8}$
- Subíndices: $x_1$, $x_2$
- Vectores: $\\vec{v}$, $\\hat{i}$

IMPORTANTE: Devuelve SOLO el JSON, sin texto antes o después.
Formato exacto:
\`\`\`json
{
  "flashcards": [
    {"front": "pregunta 1", "back": "respuesta 1"},
    {"front": "pregunta 2", "back": "respuesta 2"}
  ]
}
\`\`\``;

  const userMessage = `PRIORIDAD ABSOLUTA: El usuario quiere enfocarse en "${topicContext || notebookName}".
IGNORA todo lo demás del documento y genera contenido SOLO sobre este tema.

Genera ${count} flashcards basadas en este contenido sobre "${notebookName}":

${"=".repeat(60)}
${documentText}
${"=".repeat(60)}

Recuerda:
- ${count} flashcards exactas
- Enfócate ÚNICAMENTE en: "${topicContext || notebookName}"
- Preguntas específicas sobre conceptos del texto
- Respuestas con LaTeX para fórmulas
- Solo JSON en la respuesta`;

  return { system: systemPrompt, user: userMessage };
}

function buildSummaryPrompt(
  documentText: string,
  notebookName: string,
  topicContext?: string
): { system: string; user: string } {
  const systemPrompt = `Eres un asistente de estudio. Cuando generes un resumen, sigue SIEMPRE esta estructura JSON exacta, sin markdown, sin texto extra fuera del JSON:
{
  "idea_central": "Una sola frase que resume todo el tema",
  "conceptos": [
    {
      "titulo": "Nombre del concepto",
      "explicacion": "Explicación en máximo 2-3 líneas, lenguaje claro para ESO",
      "ejemplo": "Un ejemplo concreto y corto"
    }
  ],
  "conexion_final": "Una frase que conecta todos los conceptos entre sí"
}

REGLAS CRÍTICAS:
- Devuelve SOLO el JSON, sin markdown, sin texto antes o después
- Máximo 5 conceptos
- Nunca copies el texto original verbatim
- Lenguaje simple y directo para estudiante de 4º ESO
- Si hay fórmulas matemáticas, inclúyelas con $...$ para inline
- El campo "conexion_final" debe explicar cómo se relacionan los conceptos

EJEMPLO DE RESPUESTA CORRECTA:
{"idea_central":"Las reacciones químicas transforman sustancias en otras diferentes","conceptos":[{"titulo":"Reactivos y productos","explicacion":"Los reactivos son las sustancias iniciales que se transforman. Los productos son las sustancias finales obtenidas.","ejemplo":"En $2H_2 + O_2 \\rightarrow 2H_2O$, los reactivos son $H_2$ y $O_2$, el producto es $H_2O$"},{"titulo":"Ley de conservación de la masa","explicacion":"En una reacción química la masa total se conserva. No se crea ni se destruye materia.","ejemplo":"Si quemamos 12g de carbono con 32g de oxígeno, obtenemos 44g de $CO_2$"}],"conexion_final":"Todas las reacciones siguen la ley de conservación: los átomos se reorganizan pero su número total permanece igual."}`;

  const userMessage = `PRIORIDAD ABSOLUTA: El usuario quiere enfocarse en "${topicContext || notebookName}".
IGNORA todo lo demás del documento y genera contenido SOLO sobre este tema.

Crea un resumen estructurado en JSON de este contenido sobre "${notebookName}"${topicContext ? `, enfocándote específicamente en: "${topicContext}"` : ""}:

${"=".repeat(60)}
${documentText}
${"=".repeat(60)}

Enfócate ÚNICAMENTE en: "${topicContext || notebookName}"

Recuerda: SOLO JSON, sin markdown, sin texto extra.`;

  return { system: systemPrompt, user: userMessage };
}

function buildTestPrompt(
  documentText: string,
  notebookName: string,
  questionCount: number,
  topicContext?: string
): { system: string; user: string } {
  const systemPrompt = `${SYSTEM_INSTRUCTION_BASE}

ROL: Eres un profesor que crea tests tipo EVAU para estudiantes de 4º ESO.

OBJETIVO: Generar ${questionCount} preguntas tipo test basadas en "${notebookName}".

TIPOS DE PREGUNTAS (mezcla estos tipos):
- Recordatorio: "¿Qué es...?"
- Comprensión: "¿Por qué ocurre...?"
- Aplicación: "Si X, entonces Y porque..."
- Análisis: "¿Cuál es la relación entre X e Y?"

REGLAS:
1. ${questionCount} preguntas exactas
2. Cada pregunta tiene 4 opciones (A, B, C, D)
3. Solo UNA respuesta correcta
4. Los distractores deben ser plausibles (no obviously wrong)
5. Incluir explicación de por qué la correcta es la correcta
6. Usar LaTeX para fórmulas si es necesario

FORMATO JSON:
\`\`\`json
{
  "questions": [
    {
      "question": "¿Cuál es...?",
      "options": ["A: opción", "B: opción", "C: opción", "D: opción"],
      "correctAnswer": 0,
      "explanation": "La respuesta correcta es A porque..."
    }
  ]
}
\`\`\``;

  const userMessage = `PRIORIDAD ABSOLUTA: El usuario quiere enfocarse en "${topicContext || notebookName}".
IGNORA todo lo demás del documento y genera contenido SOLO sobre este tema.

Genera un test de ${questionCount} preguntas sobre "${notebookName}"${topicContext ? `, enfocándote específicamente en: "${topicContext}"` : ""}:

${"=".repeat(60)}
${documentText}
${"=".repeat(60)}

Enfócate ÚNICAMENTE en: "${topicContext || notebookName}"`;

  return { system: systemPrompt, user: userMessage };
}

function buildMindmapPrompt(
  documentText: string,
  notebookName: string,
  topicContext?: string
): { system: string; user: string } {
  const systemPrompt = `Eres un asistente de estudio. Genera un mapa conceptual en JSON con esta estructura exacta, sin markdown ni texto extra:
{
  "titulo": "Título del tema principal",
  "contenido": "Breve descripción del tema (máximo 1 frase)",
  "hijos": [
    {
      "titulo": "Concepto hijo 1",
      "contenido": "Breve explicación (máximo 1 frase)",
      "hijos": [
        { "titulo": "Subconcepto", "contenido": "Explicación" }
      ]
    }
  ]
}

REGLAS:
- Máximo 3 niveles de profundidad inicialmente
- Cada nodo debe tener entre 2 y 4 hijos
- No copies texto original del documento
- Usa explicaciones propias y concisas
- Si hay fórmulas importantes, inclúyelas con $...$
- Máximo 4 hijos por nodo
- Devuelve SOLO JSON válido, sin texto antes o después

EJEMPLO DE RESPUESTA:
{"titulo":"Reacciones Químicas","contenido":"Transformación de sustancias en otras diferentes","hijos":[{"titulo":"Reactivos y Productos","contenido":"Sustancias iniciales y finales de una reacción","hijos":[{"titulo":"Reactivos","contenido":"Se transforman durante la reacción"},{"titulo":"Productos","contenido":"Se obtienen al final de la reacción"}]},{"titulo":"Ley de Conservación","contenido":"La masa total se mantiene constante","hijos":[{"titulo":"Átomos","contenido":"Se reorganizan pero no se crean ni se destruyen"}]}]}`;

  const userMessage = `PRIORIDAD ABSOLUTA: El usuario quiere enfocarse en "${topicContext || notebookName}".
IGNORA todo lo demás del documento y genera contenido SOLO sobre este tema.

Genera un mapa conceptual en JSON del tema "${notebookName}"${topicContext ? `, enfocándote específicamente en: "${topicContext}"` : ""}:

${"=".repeat(60)}
${documentText}
${"=".repeat(60)}

Enfócate ÚNICAMENTE en: "${topicContext || notebookName}"

Devuelve SOLO el JSON, sin explicaciones.`;

  return { system: systemPrompt, user: userMessage };
}

function buildExpandNodePrompt(
  nodeTitle: string,
  parentContext: string,
  notebookName: string
): { system: string; user: string } {
  const systemPrompt = `Eres un asistente de estudio. Expandir un nodo del mapa conceptual en JSON.

CONTEXTO: El tema es "${notebookName}"
NODO A EXPANDIR: "${nodeTitle}"
CONTEXTO DEL PADRE: "${parentContext}"

Genera hijos para este nodo en JSON:
{
  "hijos": [
    {
      "titulo": "Concepto específico",
      "contenido": "Breve explicación (máximo 1 frase)",
      "hijos": []
    }
  ]
}

REGLAS:
- Genera entre 2 y 4 hijos
- Los hijos deben ser subconceptos específicos de "${nodeTitle}"
- No repitas información del padre
- Usa explicaciones propias y concisas
- Devuelve SOLO JSON válido con clave "hijos"
- Los hijos nuevos vienen vacíos (hijos: []) para expansión futura`;

  const userMessage = `Expande el nodo "${nodeTitle}" del mapa conceptual de "${notebookName}". Devuelve SOLO el JSON con la clave "hijos".`;

  return { system: systemPrompt, user: userMessage };
}

export async function generateSummary(
  documentText: string,
  notebookName: string,
  callbacks?: GenerationCallbacks,
  topicContext?: string
): Promise<GeneratedContent | null> {
  try {
    const truncatedText = truncateForAPI(documentText, notebookName);
    const { system, user } = buildSummaryPrompt(
      truncatedText,
      notebookName,
      topicContext
    );

    const response = await chatWithAI([], user, system, {
      maxTokens: 4096,
      temperature: 0.5,
      onProviderChange: callbacks?.onProviderChange,
      onRetrying: callbacks?.onRetrying,
      onFallback: callbacks?.onFallback,
    });

    if (!response.success || !response.text) {
      throw new Error(response.error || "No se pudo generar el resumen");
    }

    let structuredSummary: StructuredSummary;

    try {
      const jsonStr = extractJSON(response.text);
      const parsed = JSON.parse(jsonStr);

      if (!parsed.idea_central || !parsed.conceptos || !parsed.conexion_final) {
        throw new Error("JSON no tiene la estructura esperada");
      }

      structuredSummary = {
        idea_central: parsed.idea_central,
        conceptos: parsed.conceptos.slice(0, 5),
        conexion_final: parsed.conexion_final,
      };
    } catch (parseError) {
      console.error("Error parsing summary JSON:", parseError);
      console.error("Raw response:", response.text);
      structuredSummary = {
        idea_central: "Resumen de " + notebookName,
        conceptos: [
          {
            titulo: "Contenido",
            explicacion: response.text.substring(0, 500),
            ejemplo: "",
          },
        ],
        conexion_final: "Revisa el contenido para más detalles",
      };
    }

    return {
      id: `summary_${Date.now()}`,
      type: "summary",
      title: `Resumen: ${notebookName}`,
      content: structuredSummary,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
}

export async function generateFlashcards(
  documentText: string,
  notebookName: string,
  count: number = 20,
  callbacks?: GenerationCallbacks,
  topicContext?: string
): Promise<GeneratedContent | null> {
  try {
    const truncatedText = truncateForAPI(documentText, notebookName);
    const { system, user } = buildFlashcardPrompt(
      truncatedText,
      notebookName,
      count,
      topicContext
    );

    const response = await chatWithAI([], user, system, {
      maxTokens: 8192,
      temperature: 0.7,
      onProviderChange: callbacks?.onProviderChange,
      onRetrying: callbacks?.onRetrying,
      onFallback: callbacks?.onFallback,
    });

    if (!response.success || !response.text) {
      throw new Error(
        response.error || "No se pudieron generar las flashcards"
      );
    }

    try {
      let jsonStr = extractJSON(response.text);

      const parsed = JSON.parse(jsonStr);
      const flashcards: Flashcard[] = parsed.flashcards || [];

      if (flashcards.length === 0) {
        throw new Error("No se generaron flashcards");
      }

      if (flashcards.length < count) {
        console.warn(
          `⚠️ Solo se generaron ${flashcards.length}/${count} flashcards`
        );
      }

      return {
        id: `flashcards_${Date.now()}`,
        type: "flashcards",
        title: `Flashcards: ${notebookName}`,
        content: flashcards,
        createdAt: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error("Error parsing flashcards:", parseError);
      console.error("Raw response:", response.text);
      throw new Error("No se pudo interpretar la respuesta de la IA");
    }
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return null;
  }
}

export async function generateTest(
  documentText: string,
  notebookName: string,
  questionCount: number = 5,
  callbacks?: GenerationCallbacks,
  topicContext?: string
): Promise<GeneratedContent | null> {
  try {
    const truncatedText = truncateForAPI(documentText, notebookName);
    const { system, user } = buildTestPrompt(
      truncatedText,
      notebookName,
      questionCount,
      topicContext
    );

    const response = await chatWithAI([], user, system, {
      onProviderChange: callbacks?.onProviderChange,
      onRetrying: callbacks?.onRetrying,
      onFallback: callbacks?.onFallback,
    });

    if (!response.success || !response.text) {
      throw new Error(response.error || "No se pudo generar el test");
    }

    try {
      let jsonStr = extractJSON(response.text);
      const parsed = JSON.parse(jsonStr);
      const questions: TestQuestion[] = (parsed.questions || []).map(
        (q: any, idx: number) => ({
          id: `q_${idx}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })
      );

      return {
        id: `test_${Date.now()}`,
        type: "test",
        title: `Test: ${notebookName}`,
        content: questions,
        createdAt: new Date().toISOString(),
      };
    } catch {
      return {
        id: `test_${Date.now()}`,
        type: "test",
        title: `Test: ${notebookName}`,
        content: [
          {
            id: "q_0",
            question: "¿Cuál es el concepto principal?",
            options: ["Opción A", "Opción B", "Opción C", "Opción D"],
            correctAnswer: 0,
            explanation: response.text?.substring(0, 200) || "",
          },
        ],
        createdAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error("Error generating test:", error);
    return null;
  }
}

export async function generateDiagram(
  documentText: string,
  notebookName: string,
  callbacks?: GenerationCallbacks,
  topicContext?: string
): Promise<GeneratedContent | null> {
  try {
    const truncatedText = truncateForAPI(documentText, notebookName);
    const { system, user } = buildMindmapPrompt(
      truncatedText,
      notebookName,
      topicContext
    );

    const response = await chatWithAI([], user, system, {
      onProviderChange: callbacks?.onProviderChange,
      onRetrying: callbacks?.onRetrying,
      onFallback: callbacks?.onFallback,
    });

    if (!response.success || !response.text) {
      throw new Error(response.error || "No se pudo generar el esquema");
    }

    let mindmapData: InteractiveMindmap;

    try {
      const jsonStr = extractJSON(response.text);
      const parsed = JSON.parse(jsonStr);

      if (!parsed.titulo || !parsed.contenido) {
        throw new Error("JSON no tiene la estructura esperada");
      }

      mindmapData = {
        titulo: parsed.titulo,
        contenido: parsed.contenido,
        hijos: parsed.hijos || [],
      };
    } catch (parseError) {
      console.error("Error parsing mindmap JSON:", parseError);
      console.error("Raw response:", response.text);
      mindmapData = {
        titulo: notebookName,
        contenido: "Mapa conceptual",
        hijos: [],
      };
    }

    return {
      id: `diagram_${Date.now()}`,
      type: "mindmap",
      title: `Esquema: ${notebookName}`,
      content: mindmapData,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating diagram:", error);
    return null;
  }
}

export async function expandMindmapNode(
  nodeTitle: string,
  parentContext: string,
  notebookName: string,
  callbacks?: GenerationCallbacks
): Promise<MindmapNode[] | null> {
  try {
    const { system, user } = buildExpandNodePrompt(
      nodeTitle,
      parentContext,
      notebookName
    );

    const response = await chatWithAI([], user, system, {
      maxTokens: 2048,
      temperature: 0.7,
      onProviderChange: callbacks?.onProviderChange,
      onRetrying: callbacks?.onRetrying,
      onFallback: callbacks?.onFallback,
    });

    if (!response.success || !response.text) {
      throw new Error(response.error || "No se pudo expandir el nodo");
    }

    const jsonStr = extractJSON(response.text);
    const parsed = JSON.parse(jsonStr);

    if (parsed.hijos && Array.isArray(parsed.hijos)) {
      return parsed.hijos.map((child: any, idx: number) => ({
        id: `${Date.now()}_${idx}`,
        titulo: child.titulo || "Concepto",
        contenido: child.contenido || "",
        hijos: child.hijos || [],
      }));
    }

    return null;
  } catch (error) {
    console.error("Error expanding mindmap node:", error);
    return null;
  }
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);
  if (jsonMatch) {
    return jsonMatch[1] || jsonMatch[2];
  }

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    return text.substring(braceStart, braceEnd + 1);
  }

  return text;
}

const MAX_CHARS_FOR_GROQ = 8000;

function truncateForAPI(documentText: string, notebookName: string): string {
  if (documentText.length <= MAX_CHARS_FOR_GROQ) {
    return documentText;
  }

  const truncated = documentText.substring(0, MAX_CHARS_FOR_GROQ);
  const lastNewline = truncated.lastIndexOf("\n");
  const lastPeriod = truncated.lastIndexOf(". ");

  const cutPoint =
    lastNewline > MAX_CHARS_FOR_GROQ - 500
      ? lastNewline
      : lastPeriod > MAX_CHARS_FOR_GROQ - 200
        ? lastPeriod + 1
        : MAX_CHARS_FOR_GROQ;

  console.warn(
    `📄 Documento truncado de ${documentText.length} a ${cutPoint} caracteres para Groq`
  );

  return truncated.substring(0, cutPoint);
}
