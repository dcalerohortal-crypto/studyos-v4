import { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import PhysicsSimulator from "./visualizations/PhysicsSimulator";
import FormulaRenderer from "./FormulaRenderer";
import StepControls from "./StepControls";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { chatWithAI } from "@/lib/apiClient";
import { renderArtifacts } from "./TutorAIController";
import type { PhysicsSimulationType, TutorMessage, VisualStep } from "@/types";
import type { AIProvider } from "@/lib/apiClient";

interface TutorChatProps {
  cuadernoId: string;
  materia: string;
  onClose?: () => void;
  className?: string;
}

interface ToolResult {
  type: "simulation" | "formula" | "chart" | "diagram" | "animation";
  data: any;
}

const getTutorSystemPrompt = (
  materia: string
) => `Eres un tutor de física interactivo para estudiantes de 4º ESO / 1º Bachillerato en España.

PERSONALIDAD:
- Amigable pero educativo
- Guía con preguntas, no des respuestas directas
- Usa ejemplos del mundo real (coches, fútbol, móviles)
- Corrige errores con paciencia

REGLAS:
1. Divide las explicaciones en 2-3 pasos máximo
2. Cada paso debe tener una visualización cuando sea posible
3. El estudiante puede preguntar en cualquier momento
4. Usa fórmulas KaTeX cuando sea relevante (formato: $formula$ o $$\\frac{a}{b}$$)

VISUALIZACIONES AUTOMÁTICAS:
Cuando expliques estos temas, genera automáticamente la visualización adecuada:

1. **MRU / URM**: "simulación:urm" → crearé una simulación de movimiento rectilíneo uniforme
2. **MCU / UCM**: "simulación:ucm" → crearé una simulación de movimiento circular
3. **FUERZA CENTRÍPETA**: "simulación:centripetal" → crearé una simulación de fuerza centrípeta

Para solicitar una simulación, escribe al final de tu respuesta:
[VISUAL: tipo=urm|ucm|centripetal, param1=valor1, param2=valor2]

EJEMPLO DE CONVERSACIÓN:
Estudiante: "¿Qué es el MRU?"
Tú: "¡Buena pregunta! El MRU es el movimiento más básico. Imagina un coche en una autopista a 120 km/h sin acelerar. Ese coche recorre distancias IGUALES en tiempos IGUALES. $v = \\frac{d}{t}$ [VISUAL: tipo=urm]

CONOCIMIENTO:
- Nivel: 4º ESO / 1º Bachillerato español
- Asignatura: ${materia}
- Sistema educativo: LOMLOE`;

const getMensajeInicial = (materia: string) => ({
  id: "welcome",
  rol: "ai" as const,
  contenido: `¡Hola! Soy tu tutor de ${materia}. 

Puedo explicarte conceptos con visualizaciones interactivas. Vamos paso a paso y tú decides cuándo continuar.

¿Qué tema quieres que veamos?`,
  timestamp: new Date().toISOString(),
});

export default function TutorChat({
  cuadernoId,
  materia,
  onClose,
  className = "",
}: TutorChatProps) {
  const [mensajes, setMensajes] = useState<TutorMessage[]>([
    getMensajeInicial(materia),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [currentProvider, setCurrentProvider] = useState<AIProvider | null>(
    null
  );
  const [providerStatus, setProviderStatus] = useState<
    "connected" | "disconnected" | "unknown"
  >("unknown");

  const [simulacionActual, setSimulacionActual] = useState<{
    tipo: PhysicsSimulationType;
    params: any;
  } | null>(null);

  const [formulas, setFormulas] = useState<
    Array<{ formula: string; nombre?: string }>
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    interimTranscript,
    toggle: toggleVoice,
    isSupported: voiceSupported,
  } = useVoiceInput({
    lang: "es-ES",
    onTranscript: text => {
      setInput(text);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, simulacionActual, formulas]);

  useEffect(() => {
    if (interimTranscript) {
      setInput(interimTranscript);
    }
  }, [interimTranscript]);

  const parseVisualCommands = (
    text: string
  ): {
    cleanText: string;
    visualizations: Array<{ tipo: string; params: Record<string, any> }>;
  } => {
    const visualizations: Array<{ tipo: string; params: Record<string, any> }> =
      [];

    const visualRegex = /\[VISUAL:\s*tipo=(\w+)(?:,\s*([^;\]]+))?\]/gi;
    let match;

    while ((match = visualRegex.exec(text)) !== null) {
      const tipo = match[1].toLowerCase();
      const params: Record<string, any> = {};

      if (match[2]) {
        const paramPairs = match[2].split(",");
        for (const pair of paramPairs) {
          const [key, value] = pair.split("=").map(s => s.trim());
          if (key && value) {
            params[key] = isNaN(Number(value)) ? value : Number(value);
          }
        }
      }

      visualizations.push({ tipo, params });
    }

    const cleanText = text.replace(/\[VISUAL:\s*[^\]]+\]/gi, "").trim();

    return { cleanText, visualizations };
  };

  const parseFormulasFromText = (
    text: string
  ): Array<{ formula: string; nombre?: string }> => {
    const formulas: Array<{ formula: string; nombre?: string }> = [];

    const dollarRegex = /\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g;
    let match;

    while ((match = dollarRegex.exec(text)) !== null) {
      const formula = match[1] || match[2];
      if (formula && formula.length > 2 && !formula.includes("[VISUAL")) {
        formulas.push({ formula: formula.trim() });
      }
    }

    return formulas;
  };

  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || isLoading) return;

    const mensajeUsuario: TutorMessage = {
      id: Date.now().toString(),
      rol: "usuario",
      contenido: texto,
      timestamp: new Date().toISOString(),
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    setInput("");
    setIsLoading(true);
    setSimulacionActual(null);
    setFormulas([]);

    const userMessageForHistory = texto;
    const newHistory = [
      ...conversationHistory,
      { role: "user" as const, content: texto },
    ];

    try {
      const systemPrompt = getTutorSystemPrompt(materia);

      const result = await chatWithAI(
        conversationHistory,
        texto,
        systemPrompt,
        {
          preferProvider: "ollama",
          temperature: 0.7,
          maxTokens: 4096,
          onProviderChange: provider => {
            setCurrentProvider(provider);
            setProviderStatus("connected");
          },
        }
      );

      if (!result.success || !result.text) {
        throw new Error(result.error || "No se pudo obtener respuesta");
      }

      const { cleanText, visualizations } = parseVisualCommands(result.text);
      const extractedFormulas = parseFormulasFromText(cleanText);

      setConversationHistory(prev => [
        ...prev,
        { role: "assistant" as const, content: result.text || "" },
      ]);

      const mensajeIA: TutorMessage = {
        id: (Date.now() + 1).toString(),
        rol: "ai",
        contenido: cleanText,
        timestamp: new Date().toISOString(),
      };

      setMensajes(prev => [...prev, mensajeIA]);
      setFormulas(extractedFormulas);

      if (visualizations.length > 0) {
        const firstVis = visualizations[0];
        if (
          firstVis.tipo === "urm" ||
          firstVis.tipo === "ucm" ||
          firstVis.tipo === "centripetal"
        ) {
          setSimulacionActual({
            tipo: firstVis.tipo,
            params: firstVis.params,
          });
        }
      }
    } catch (error) {
      const errorMsg: TutorMessage = {
        id: (Date.now() + 1).toString(),
        rol: "ai",
        contenido: `Lo siento, tuve un error al procesar tu pregunta: ${error instanceof Error ? error.message : "Error desconocido"}. ¿Quieres que lo intente de nuevo?`,
        timestamp: new Date().toISOString(),
      };
      setMensajes(prev => [...prev, errorMsg]);
      setProviderStatus("disconnected");
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = () => {
    switch (currentProvider) {
      case "ollama":
        return <Wifi className="w-3 h-3 text-green-500" />;
      case "gemini":
        return <Wifi className="w-3 h-3 text-blue-500" />;
      case "groq":
        return <Wifi className="w-3 h-3 text-orange-500" />;
      default:
        return providerStatus === "disconnected" ? (
          <WifiOff className="w-3 h-3 text-red-500" />
        ) : (
          <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
        );
    }
  };

  const getProviderName = () => {
    switch (currentProvider) {
      case "ollama":
        return "Ollama Cloud";
      case "gemini":
        return "Gemini";
      case "groq":
        return "Groq";
      default:
        return "Conectando...";
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Tutor de {materia}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {getProviderIcon()}
              {getProviderName()}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.rol === "usuario" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.rol === "usuario"
                  ? "bg-accent text-white rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
              <span className="text-[10px] opacity-60 mt-1 block">
                {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  Pensando con {getProviderName()}...
                </span>
              </div>
            </div>
          </div>
        )}

        {formulas.length > 0 && (
          <div className="mt-4 space-y-3">
            {formulas.map((f, i) => (
              <div
                key={i}
                className="bg-card/80 backdrop-blur border border-border rounded-xl p-4"
              >
                <div className="flex justify-center py-2">
                  <FormulaRenderer formula={f.formula} />
                </div>
              </div>
            ))}
          </div>
        )}

        {simulacionActual && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <PhysicsSimulator
              tipo={simulacionActual.tipo}
              parametros={simulacionActual.params}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu duda..."
            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje(input);
              }
            }}
            disabled={isLoading}
          />

          {voiceSupported && (
            <button
              onClick={toggleVoice}
              className={`p-3 rounded-xl transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
              title={isListening ? "Detener grabación" : "Grabar voz"}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          <button
            onClick={() => enviarMensaje(input)}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-accent text-white rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {isListening && (
          <div className="mt-2 text-sm text-red-500 flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            Escuchando... {interimTranscript && `"${interimTranscript}"`}
          </div>
        )}
      </div>
    </div>
  );
}
