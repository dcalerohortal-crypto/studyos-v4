import { useState, useRef, useEffect } from "react";
import {
  chatWithGroq,
  parseRutinaFromResponse,
  cleanResponseText,
} from "@/lib/groqService";
import { ChatMessage } from "@/types";
import {
  Send,
  Loader2,
  Zap,
  Calendar,
  Mail,
  FolderKanban,
  Clock,
  Sparkles,
  Command,
} from "lucide-react";
import { useGameState } from "@/hooks/useGameState";
import { useAgent } from "@/hooks/useAgent";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useThinkingAgent } from "@/hooks/useThinkingAgent";
import ThinkingConsole from "@/components/agenda/ThinkingConsole";
import RutinaRenderer from "@/components/agenda/RutinaRenderer";
import { Rutina } from "@/types";

const GOOGLE_SKILLS = ["calendario", "drive", "reporte", "tracking"];

const AGENT_SKILLS = [
  {
    id: "chat",
    name: "Chat",
    icon: Sparkles,
    description: "Chat normal con IA",
  },
  {
    id: "calendario",
    name: "Calendario",
    icon: Calendar,
    description: "Sincronizar Google Calendar",
  },
  {
    id: "drive",
    name: "Drive",
    icon: FolderKanban,
    description: "Organizar archivos por materias",
  },
  {
    id: "reporte",
    name: "Reporte",
    icon: Mail,
    description: "Enviar resumen diario",
  },
  {
    id: "tracking",
    name: "Tracking",
    icon: Clock,
    description: "Rastrear tiempo de estudio",
  },
];

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSkill, setActiveSkill] = useState("chat");
  const [showCommands, setShowCommands] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatRutinas, setChatRutinas] = useState<Record<number, Rutina>>({});
  const { addXP } = useGameState();
  const {
    isConnected: googleConnected,
    connect: connectGoogle,
    getValidToken,
  } = useGoogleAuth();

  const {
    loading: agentLoading,
    organizeDrive,
  } = useAgent();

  const {
    activeChain: thinkingChain,
    isThinking: isThinkingChain,
    generateThinkingWithStream,
  } = useThinkingAgent();

  const [showThinkingConsole, setShowThinkingConsole] = useState(false);

  const handleSkillSelect = async (skillId: string) => {
    setActiveSkill(skillId);
    setShowCommands(false);
    const skill = AGENT_SKILLS.find(s => s.id === skillId);

    if (!skill) return;

    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: `Activando ${skill.name}...`,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      let response = "";

      // Obtener token de Google si está conectado
      const token = googleConnected ? await getValidToken() : null;

      // Pasar token a las funciones (esto requeriría modificar useAgent, pero por ahora las skills funcionan)

      if (skillId === "calendario") {
        response = "Esta skill estará disponible próximamente.";
      } else if (skillId === "drive") {
        if (!googleConnected) {
          response = "Necesitas conectar tu cuenta de Google primero para usar esta skill.";
        } else {
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: "Iniciando organización automática de tu Google Drive. Esto puede tardar hasta un minuto...",
              timestamp: new Date().toISOString(),
            },
          ]);
          try {
            const stats = await organizeDrive();
            if (stats && stats.length > 0) {
              response = `¡Drive organizado con éxito!\n\nEstadísticas:\n` + stats.map(s => `- ${s.folder}: ${s.filesMoved} archivos movidos`).join('\n');
            } else {
              response = "He revisado tu Drive y parece que todo está ya perfectamente organizado.";
            }
          } catch (e) {
            response = `Hubo un error al organizar tu Drive: ${e instanceof Error ? e.message : "Error desconocido"}`;
          }
        }
      } else if (skillId === "reporte") {
        response = "Esta skill estará disponible próximamente.";
      } else if (skillId === "tracking") {
        response = "Esta skill estará disponible próximamente.";
      } else {
        response = `Skill activada: ${skill.name}. ${skill.description}`;
      }

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call Groq API
      const response = await chatWithGroq(
        messages.map(m => ({ role: m.role, content: m.content })),
        input
      );

      if (response.success && response.text) {
        // Check if response contains a rutina
        const rutina = parseRutinaFromResponse(response.text);
        const cleanText = cleanResponseText(response.text);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: cleanText || response.text,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        // If rutina was generated, award XP and store for rendering
        if (rutina) {
          addXP(100, "", `Rutina creada: ${rutina.nombre}`);
          setChatRutinas(prev => ({ ...prev, [messages.length + 1]: rutina }));
        }
      } else {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: response.error || "Error al conectar con la IA",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Error al procesar tu mensaje. Intenta de nuevo.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle message with thinking chain visible
  const handleSendMessageWithThinking = async (userInput: string) => {
    const userMessage: ChatMessage = {
      role: "user",
      content: userInput,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowThinkingConsole(true);

    try {
      // Usar thinking agent para mostrar el proceso
      const result = await generateThinkingWithStream({ question: userInput });

      if (result.success && result.answer) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.answer,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: "Error al procesar tu mensaje",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Error al procesar tu mensaje. Intenta de nuevo.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle thinking console
  const toggleThinkingConsole = () => {
    setShowThinkingConsole(prev => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommands(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Command Palette Modal */}
      {showCommands && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCommands(false)}
        >
          <div
            className="bg-card border border-border rounded-xl w-full max-w-md p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Command className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Selecciona una skill
              </span>
              <kbd className="ml-auto text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                Esc
              </kbd>
            </div>
            <div className="space-y-2">
              {AGENT_SKILLS.map(skill => {
                const needsGoogle = GOOGLE_SKILLS.includes(skill.id);
                // Si es drive y está conectado, no está deshabilitado.
                const isDisabled = needsGoogle && (!googleConnected || skill.id !== "drive"); 
                let tooltip = skill.description;
                if (needsGoogle) {
                  if (!googleConnected) {
                    tooltip = "Conecta Google primero";
                  } else if (skill.id !== "drive") {
                    tooltip = "Próximamente";
                  }
                }
                return (
                  <button
                    key={skill.id}
                    onClick={() => !isDisabled && handleSkillSelect(skill.id)}
                    disabled={isDisabled}
                    title={tooltip}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                      isDisabled
                        ? "bg-secondary/50 opacity-50 cursor-not-allowed"
                        : activeSkill === skill.id
                          ? "bg-accent/20 border border-accent"
                          : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <skill.icon
                      className={`w-5 h-5 ${isDisabled ? "text-muted-foreground/50" : activeSkill === skill.id ? "text-accent" : "text-muted-foreground"}`}
                    />
                    <div>
                      <p className={`font-medium ${isDisabled ? "text-muted-foreground" : "text-foreground"}`}>{skill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tooltip}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border p-4 md:p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agente IA</h1>
          <p className="text-muted-foreground text-sm">
            {activeSkill === "chat"
              ? "Pregúntame sobre rutinas, estudio o desarrollo personal"
              : "Skill seleccionada"}
          </p>
        </div>

        {/* Google Connection Status */}
        <button
          onClick={connectGoogle}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            googleConnected
              ? "bg-green-500/20 text-green-500 border border-green-500/30"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="hidden sm:inline">
            {googleConnected ? "Conectado" : "Conectar"}
          </span>
        </button>

        <button
          onClick={() => setShowCommands(true)}
          className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/80 transition-all"
        >
          <Command className="w-4 h-4" />
          <span className="hidden sm:inline">Skills</span>
        </button>
        <button
          onClick={toggleThinkingConsole}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            showThinkingConsole
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Thinking</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-accent/10 rounded-full mb-4">
              <Zap className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              ¿En qué puedo ayudarte?
            </h2>
            <p className="text-muted-foreground max-w-md">
              Puedo ayudarte a crear rutinas de estudio, ejercicio, salud y
              desarrollo personal. También puedo resolver dudas de cualquier
              asignatura.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md md:max-w-2xl p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-none"
                      : "glass-card text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="text-sm md:text-base whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {chatRutinas[idx] && (
                    <div className="mt-3">
                      <RutinaRenderer rutina={chatRutinas[idx]} />
                    </div>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-accent-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass-card p-4 rounded-2xl rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="text-muted-foreground text-sm">
                      Pensando...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Thinking Console - Visible when enabled */}
      {showThinkingConsole && (
        <div className="border-t border-border">
          <ThinkingConsole
            chain={thinkingChain || undefined}
            showTokens={true}
            maxHeight="300px"
            onCancel={() => setShowThinkingConsole(false)}
          />
        </div>
      )}

      {/* Input */}
      <div className="bg-card border-t border-border p-4 md:p-6">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={loading}
            className="flex-1 bg-secondary text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground rounded-xl px-4 py-3 font-semibold flex items-center gap-2 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
