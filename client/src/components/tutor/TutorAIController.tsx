import { useState, useCallback } from "react";
import { chatWithAI } from "@/lib/apiClient";
import ArtifactRenderer from "./ArtifactRenderer";
import type { TutorMessage, VisualStep } from "@/types";
import type { AIProvider } from "@/lib/apiClient";

interface ToolResult {
  type: "simulation" | "formula" | "chart" | "diagram" | "animation";
  data: any;
}

interface TutorAIControllerProps {
  materia: string;
  context?: string;
  onProviderChange?: (provider: AIProvider) => void;
}

const TUTOR_SYSTEM_PROMPT = `Eres un tutor de física interactivo para estudiantes de 4º ESO / 1º Bachillerato en España.

PERSONALIDAD:
- Amigable pero educativo
- Guía con preguntas, no das respuestas directas
- Usa ejemplos del mundo real (coches, fútbol, móviles)
- Corrige errores con paciencia

REGLAS:
1. Divide las explicaciones en 2-3 pasos máximo
2. Cada paso debe tener una visualización
3. El estudiante puede preguntar en cualquier momento
4. Usa fórmulas KaTeX cuando sea relevante

VISUALIZACIONES DISPONIBLES:
Usa estas herramientas para crear visualizaciones:

1. create_simulation - Simulaciones físicas:
   - "urm" = MRU (Movimiento Rectilíneo Uniforme)
   - "ucm" = MCU (Movimiento Circular Uniforme)  
   - "centripetal" = Fuerza Centrípeta

2. show_formula - Fórmulas matemáticas con KaTeX:
   - Usa formato LaTeX: v = \\frac{d}{t}

3. create_chart - Gráficos (barras o líneas)

4. create_diagram - Diagramas SVG:
   - "force" = Diagrama de fuerzas
   - "motion" = Diagrama de movimiento
   - "energy" = Diagrama de energía

RESPUESTAS:
Responde de forma NATURAL y CONVERSACIONAL. NO devuelvas JSON directamente.
Después de explicar con palabras, usa las herramientas para mostrar visualizaciones.

EJEMPLO DE CONVERSACIÓN:
Estudiante: "¿Qué es el MRU?"
Tú: "¡Buena pregunta! El MRU es el movimiento más básico. Imagina un coche en una autopista a 120 km/h sin acelerar. Ese coche recorre distancias IGUALES en tiempos IGUALES. Voy a mostrarte cómo funciona con una simulación."

[Aquí usarías create_simulation con tipo "urm"]

CONOCIMIENTO:
- Nivel: 4º ESO / 1º Bachillerato español
- Asignatura: Física y Química / Física
- Sistema educativo: LOMLOE
- Preparando para EVAU (importante en Madrid)`;

export default function TutorAIController({
  materia,
  context = "",
  onProviderChange,
}: TutorAIControllerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<AIProvider | null>(
    null
  );
  const [artifacts, setArtifacts] = useState<ToolResult[]>([]);

  const processResponse = useCallback(
    async (
      userMessage: string,
      conversationHistory: Array<{
        role: "user" | "assistant";
        content: string;
      }>
    ): Promise<{
      response: string;
      artifacts: ToolResult[];
    }> => {
      setIsLoading(true);
      setError(null);
      setArtifacts([]);

      const systemPrompt = `${TUTOR_SYSTEM_PROMPT}

CONTEXTO ACTUAL:
- Materia: ${materia}
- ${context ? `Contexto adicional: ${context}` : ""}`;

      try {
        const result = await chatWithAI(
          conversationHistory,
          userMessage,
          systemPrompt,
          {
            preferProvider: "ollama",
            temperature: 0.7,
            maxTokens: 4096,
            onProviderChange: provider => {
              console.log("Proveedor activo:", provider);
              setCurrentProvider(provider);
              onProviderChange?.(provider);
            },
          }
        );

        if (!result.success) {
          throw new Error(result.error || "Error desconocido");
        }

        const artifacts = parseArtifactsFromResponse(result.text || "");
        setArtifacts(artifacts);

        const cleanResponse = cleanResponseText(result.text || "");

        return {
          response: cleanResponse,
          artifacts,
        };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Error al procesar";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [materia, context, onProviderChange]
  );

  return {
    processResponse,
    isLoading,
    error,
    currentProvider,
    artifacts,
  };
}

function parseArtifactsFromResponse(text: string): ToolResult[] {
  const artifacts: ToolResult[] = [];

  const simulationMatches = text.matchAll(/```simulation\s*\n([\s\S]*?)```/gi);
  for (const match of simulationMatches) {
    try {
      const data = JSON.parse(match[1]);
      if (data.type && data.params) {
        artifacts.push({
          type: "simulation",
          data: {
            type: data.type,
            params: data.params,
            titulo: data.titulo || "Simulación",
          },
        });
      }
    } catch {
      const typeMatch = match[1].match(
        /(?:type|tipo)\s*[:=]\s*["']?(\w+)["']?/i
      );
      if (typeMatch) {
        artifacts.push({
          type: "simulation",
          data: {
            type: typeMatch[1],
            params: {},
            titulo: "Simulación",
          },
        });
      }
    }
  }

  const formulaMatches = text.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g);
  for (const match of formulaMatches) {
    const formula = match[1] || match[2];
    if (formula && formula.length > 2) {
      artifacts.push({
        type: "formula",
        data: {
          formula: formula.trim(),
          nombre: "Fórmula",
          descripcion: "Ecuación importante",
        },
      });
      break;
    }
  }

  const diagramKeywords = [
    "diagrama",
    "fuerza",
    "diagrama de cuerpo libre",
    "vector",
  ];
  if (diagramKeywords.some(k => text.toLowerCase().includes(k))) {
    const forceMatch = text.match(/fuerza|masa|peso|normal|fricción/gi);
    if (forceMatch && forceMatch.length >= 2) {
      artifacts.push({
        type: "diagram",
        data: {
          tipo: "force",
          titulo: "Diagrama de Fuerzas",
        },
      });
    }
  }

  return artifacts;
}

function cleanResponseText(text: string): string {
  let cleaned = text
    .replace(/```simulation[\s\S]*?```/gi, "")
    .replace(/```json[\s\S]*?```/gi, "")
    .replace(/```[\s\S]*?```/gi, "")
    .trim();

  cleaned = cleaned
    .replace(/\$\$([\s\S]*?)\$\$/g, "[$1]")
    .replace(/\$([^$]+)\$/g, "[$1]");

  return cleaned;
}

export function parseToolCallsFromText(text: string): ToolResult[] {
  const artifacts: ToolResult[] = [];

  if (
    text.toLowerCase().includes("mru") ||
    text.toLowerCase().includes("urm")
  ) {
    if (
      !text.toLowerCase().includes("simulación") &&
      !text.includes("```simulation")
    ) {
      artifacts.push({
        type: "simulation",
        data: {
          type: "urm",
          params: { velocidadInicial: 5, posicionInicial: 0 },
          titulo: "Movimiento Rectilíneo Uniforme",
        },
      });
    }
  }

  if (
    text.toLowerCase().includes("mcu") ||
    text.toLowerCase().includes("ucm") ||
    text.toLowerCase().includes("circular")
  ) {
    if (!text.toLowerCase().includes("simulación")) {
      artifacts.push({
        type: "simulation",
        data: {
          type: "ucm",
          params: { radio: 80, periodo: 4 },
          titulo: "Movimiento Circular Uniforme",
        },
      });
    }
  }

  if (
    text.toLowerCase().includes("fuerza centrípeta") ||
    text.toLowerCase().includes("centrí")
  ) {
    if (!text.toLowerCase().includes("simulación")) {
      artifacts.push({
        type: "simulation",
        data: {
          type: "centripetal",
          params: { radio: 80, masa: 2, velocidadLineal: 10 },
          titulo: "Fuerza Centrípeta",
        },
      });
    }
  }

  return artifacts;
}

export function renderArtifacts(text: string): {
  cleanText: string;
  artifacts: ToolResult[];
} {
  const parsed = parseArtifactsFromResponse(text);
  const inferred = parseToolCallsFromText(text);

  const allArtifacts = [...parsed];
  for (const artifact of inferred) {
    if (
      !allArtifacts.some(
        a =>
          a.type === artifact.type &&
          JSON.stringify(a.data) === JSON.stringify(artifact.data)
      )
    ) {
      allArtifacts.push(artifact);
    }
  }

  return {
    cleanText: cleanResponseText(text),
    artifacts: allArtifacts,
  };
}
