import { useCallback, useRef } from "react";
import { chatWithAI } from "@/lib/apiClient";
import { useThinkingChain, ThinkingChain } from "./useThinkingChain";

export interface GenerateThinkingOptions {
  question: string;
  context?: Record<string, any>;
  streamResponse?: boolean;
  showTokens?: boolean;
}

const THINKING_SYSTEM_PROMPT = `Eres un asistente de IA que explica su proceso de pensamiento de forma transparente.

Tu objetivo es llegar a la respuesta correcta mostrando cada paso del razonamiento.

Estructura tu respuesta en estos tipos de pasos:
1. observation - Hechos o información relevante que observas
2. reasoning - Tu proceso de razonamiento lógico
3. conclusion - Una conclusión intermedia
4. action - Una acción que decides tomar
5. reflection - Reflexión sobre el proceso

Para cada paso, explica:
- Qué tipo de paso es
- Qué información tienes
- Por qué llegas a esa conclusión
- Qué sigue

Responde en formato JSON con un array de pasos:
[
  {"type": "observation", "content": "...", "tokens": 50},
  {"type": "reasoning", "content": "...", "tokens": 100},
  ...
]

Solo devuelve JSON, sin texto adicional.`;

export function useThinkingAgent() {
  const {
    activeChain,
    isThinking,
    startThinking,
    addStep,
    updateStep,
    completeStep,
    finishThinking,
    pauseThinking,
    resumeThinking,
    cancelThinking,
  } = useThinkingChain();

  const abortControllerRef = useRef<AbortController | null>(null);

  // Generar pensamiento step a step
  const generateThinking = useCallback(
    async (options: GenerateThinkingOptions) => {
      const { question, context, showTokens = true } = options;

      // Cancelar cualquier generación previa
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Crear nueva cadena de pensamiento
      const chain = startThinking(question);

      try {
        // Simular proceso de pensamiento con la IA
        // En producción, esto usaría streaming real

        // Paso 1: Observación
        await addStep(
          "observation",
          `Analizando la pregunta: "${question}"`,
          30
        );
        await new Promise(r => setTimeout(r, 500));

        // Obtener contexto relevante
        if (context) {
          await addStep(
            "reasoning",
            `Tengo contexto adicional: ${JSON.stringify(context).slice(0, 100)}...`,
            45
          );
          await new Promise(r => setTimeout(r, 500));
        }

        // Llamar a la IA para obtener respuesta
        const response = await chatWithAI([], question, THINKING_SYSTEM_PROMPT);

        if (response.success && response.text) {
          // Intentar parsear JSON de los pasos
          try {
            const steps = JSON.parse(
              response.text.replace(/```json|```/g, "").trim()
            );

            for (const step of steps) {
              await addStep(step.type, step.content, step.tokens);
              await new Promise(r => setTimeout(r, 300));
            }
          } catch {
            // Si no es JSON, crear un único paso de conclusion
            await addStep(
              "conclusion",
              response.text,
              response.text.length / 4
            );
          }

          // Finalizar con la respuesta
          finishThinking(response.text);

          return {
            success: true,
            chain,
            answer: response.text,
          };
        } else {
          cancelThinking();
          return {
            success: false,
            error: response.error,
          };
        }
      } catch (error) {
        cancelThinking();
        return {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        };
      }

      return { success: false, error: "Sin respuesta" };
    },
    [startThinking, addStep, finishThinking, cancelThinking]
  );

  // Versión con streaming simulado (para mostrar el proceso)
  const generateThinkingWithStream = useCallback(
    async (options: GenerateThinkingOptions) => {
      const { question } = options;

      const chain = startThinking(question);

      // Simular pensar en voz alta
      const thoughtProcess = [
        {
          type: "observation" as const,
          content: `Nueva pregunta recibida: "${question}"`,
          tokens: 25,
        },
        {
          type: "reasoning" as const,
          content:
            "Necesito analizar los componentes de la pregunta y determinar el mejor enfoque.",
          tokens: 40,
        },
        {
          type: "observation" as const,
          content:
            "Identifico que es una pregunta sobre StudyOS y el sistema gamificado.",
          tokens: 35,
        },
        {
          type: "reasoning" as const,
          content:
            "Dado el contexto, debo proporcionar información precisa sobre las features.",
          tokens: 50,
        },
        {
          type: "conclusion" as const,
          content:
            "La mejor respuesta incluye las missions completadas y actuales.",
          tokens: 45,
        },
        {
          type: "reflection" as const,
          content:
            "El usuario quiere saber el progreso, debo ser conciso y útil.",
          tokens: 30,
        },
      ];

      for (const thought of thoughtProcess) {
        await addStep(thought.type, thought.content, thought.tokens);
        await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      }

      const finalAnswer =
        "Nuestras Missions completadas hasta ahora:\n\n✅ Misión 1: Motor de Datos Híbrido (Supabase + JSONB)\n✅ Misión 2: UI de Agenda y Dashboard XP\n✅ Misión 3: Agente IA con Skills\n\n📍 Misión 4: Thinking Console (en progreso)";

      finishThinking(finalAnswer);

      return {
        success: true,
        chain,
        answer: finalAnswer,
      };
    },
    [startThinking, addStep, finishThinking]
  );

  // Pausar generación
  const pause = useCallback(() => {
    pauseThinking();
  }, [pauseThinking]);

  // Reanudar generación
  const resume = useCallback(() => {
    resumeThinking();
  }, [resumeThinking]);

  // Cancelar completamente
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cancelThinking();
  }, [cancelThinking]);

  return {
    activeChain,
    isThinking,
    generateThinking,
    generateThinkingWithStream,
    pause,
    resume,
    cancel,
  };
}
