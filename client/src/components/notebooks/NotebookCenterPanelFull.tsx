import { useState, useRef, useEffect, useCallback } from "react";
import { Notebook } from "@/types";
import {
  Send,
  Mic,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FileText,
  Youtube,
  Globe,
  Image,
  File,
  RefreshCw,
} from "lucide-react";
import { chatWithAI } from "@/lib/apiClient";
import { getTutorTools } from "@/lib/ollamaService";
import { getSubjectPrompt } from "@/lib/tutorPrompts";
import { getAllDocumentsText, ContentSource } from "@/lib/contentProcessor";
import MathRenderer from "./MathRenderer";
import ArtifactRenderer from "@/components/tutor/ArtifactRenderer";
import ExplanationBlock from "@/components/tutor/ExplanationBlock";

interface Props {
  notebook: Notebook;
  onUpdateNotebook: (notebook: Notebook) => void;
}

interface ToolResult {
  type: "simulation" | "formula" | "chart" | "diagram" | "animation";
  data: any;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolResults?: ToolResult[];
}

export default function NotebookCenterPanelFull({
  notebook,
  onUpdateNotebook,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedContent, setExtractedContent] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [sourcesInfo, setSourcesInfo] = useState<{
    docs: number;
    urls: number;
  }>({ docs: 0, urls: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractContent = useCallback(async () => {
    const docs = notebook.documents || [];
    const urls = notebook.urlSources || [];

    if (docs.length === 0 && urls.length === 0) {
      setExtractedContent("");
      setSourcesInfo({ docs: 0, urls: 0 });
      return;
    }

    setIsExtracting(true);

    try {
      const contentSources: ContentSource[] = [
        ...docs.map(doc => ({
          type: doc.type as ContentSource["type"],
          name: doc.name,
          data: doc.fileData,
          url: doc.fileUrl,
        })),
        ...urls.map(url => ({
          type: url.type as "youtube" | "url",
          name: url.name,
          url: url.url,
        })),
      ];

      const extraction = await getAllDocumentsText(
        contentSources,
        (source, status) => {
          console.log(`[${source}] ${status}`);
        }
      );

      setExtractedContent(extraction.text);
      setSourcesInfo({ docs: docs.length, urls: urls.length });
    } catch (err) {
      console.error("Error extrayendo contenido:", err);
      setExtractedContent("");
    } finally {
      setIsExtracting(false);
    }
  }, [notebook.documents, notebook.urlSources]);

  useEffect(() => {
    extractContent();
  }, [extractContent]);

  const handleReextract = () => {
    extractContent();
  };

  const buildSystemContext = () => {
    const subjectPrompt = getSubjectPrompt(notebook.name);

    let context = subjectPrompt;

    if (extractedContent && extractedContent.trim()) {
      context += `

CONTENIDO DEL CUADERNO:
El usuario tiene los siguientes documentos/enlaces en su cuaderno de "${notebook.name}".
Usa este contenido como referencia principal para responder preguntas específicas.

---
${extractedContent}
---

Cuando el usuario pregunte sobre temas específicos (ej: "tema 3", "capítulo 2", "página 10"), busca en el contenido anterior y responde basándote en ese material.

Si el usuario pide explicaciones, ejemplos, o ejercicios, puedes usar tanto el contenido del cuaderno como tu conocimiento del tema.

Usa KaTeX/LaTeX para fórmulas matemáticas cuando sea necesario.`;
    } else if (sourcesInfo.docs > 0 || sourcesInfo.urls > 0) {
      context += `

NOTA: Hay ${sourcesInfo.docs} documento(s) y ${sourcesInfo.urls} enlace(s) en el cuaderno, pero el contenido no está disponible todavía.
Usa tu conocimiento del tema "${notebook.name}" para ayudar.`;
    }

    return context;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    setError(null);

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputValue("");
    setLoading(true);

    try {
      const systemContext = buildSystemContext();

      const response = await chatWithAI(
        currentMessages.map(m => ({ role: m.role, content: m.content })),
        inputValue,
        systemContext,
        { useTools: true }
      );

      if (response.success && response.text) {
        let toolResults: ToolResult[] | undefined;

        if (response.toolCalls && response.toolCalls.length > 0) {
          toolResults = response.toolCalls.map(call => {
            if (call.name === "create_simulation") {
              return { type: "simulation" as const, data: call.parameters };
            } else if (call.name === "show_formula") {
              return { type: "formula" as const, data: call.parameters };
            } else if (call.name === "create_chart") {
              return { type: "chart" as const, data: call.parameters };
            } else if (call.name === "create_diagram") {
              return { type: "diagram" as const, data: call.parameters };
            }
            return {
              type: "formula" as const,
              data: { formula: JSON.stringify(call.parameters) },
            };
          });
        }

        const assistantMessage: Message = {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: response.text,
          timestamp: new Date().toISOString(),
          toolResults,
        };

        const updatedMessages = [...currentMessages, assistantMessage];
        setMessages(updatedMessages);

        onUpdateNotebook({
          ...notebook,
          chatHistory: updatedMessages,
        });
      } else if (response.error) {
        console.error("Error del chat:", response.error);
        setError(response.error);

        const errorMessage: Message = {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: `⚠️ Error: ${response.error}\n\nIntentando de nuevo...`,
          timestamp: new Date().toISOString(),
        };
        setMessages([...currentMessages, errorMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    if (!isListening) {
      console.log("Escuchando...");
    }
  };

  const hasSources = sourcesInfo.docs > 0 || sourcesInfo.urls > 0;

  return (
    <div className="flex-1 bg-background flex flex-col overflow-hidden">
      {/* Sources Status Bar */}
      <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {isExtracting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Procesando documentos...</span>
            </div>
          ) : hasSources ? (
            <>
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>
                  {sourcesInfo.docs} documento
                  {sourcesInfo.docs !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>
                  {sourcesInfo.urls} enlace{sourcesInfo.urls !== 1 ? "s" : ""}
                </span>
              </div>
              {extractedContent && (
                <span className="text-green-500">✓ Contenido listo</span>
              )}
            </>
          ) : (
            <span>Sin documentos ni enlaces</span>
          )}
        </div>
        {hasSources && !isExtracting && (
          <button
            onClick={handleReextract}
            className="p-1 hover:bg-secondary rounded transition-colors"
            title="Actualizar contenido"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
            <p className="font-semibold mb-1">⚠️ Error de conexión</p>
            <p>{error}</p>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                ¿En qué puedo ayudarte?
              </p>
              {extractedContent ? (
                <p className="text-xs text-muted-foreground">
                  Puedo ver tus documentos. Pregunta sobre temas específicos:
                  "Explica el tema 3", "Resumen del capítulo 2"
                </p>
              ) : hasSources ? (
                <p className="text-xs text-muted-foreground">
                  Procesando tus documentos...
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Añade documentos o enlaces al cuaderno para que pueda ayudarte
                  mejor
                </p>
              )}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-2`}
            >
              <div
                className={`max-w-xl rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                <div className="text-sm">
                  {msg.role === "assistant" ? (
                    <ExplanationBlock
                      content={msg.content}
                      showStructured={true}
                      subject={notebook.name}
                      debug={true}
                    />
                  ) : (
                    <MathRenderer content={msg.content} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {msg.role === "assistant" && (
                    <>
                      <button className="p-1 hover:bg-white/10 rounded transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button className="p-1 hover:bg-white/10 rounded transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button className="p-1 hover:bg-white/10 rounded transition-colors">
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  <span className="text-xs opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {msg.toolResults && msg.toolResults.length > 0 && (
                <div className="flex flex-col gap-3 w-full max-w-xl">
                  {msg.toolResults.map((result, idx) => (
                    <ArtifactRenderer
                      key={idx}
                      type={result.type}
                      data={result.data}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-card">
        <div className="flex gap-2">
          <button
            onClick={handleVoiceInput}
            className={`p-3 rounded-lg transition-colors ${
              isListening
                ? "bg-red-500 text-white"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSendMessage()}
            placeholder={
              extractedContent
                ? "Pregunta sobre tus documentos..."
                : "Escribe tu pregunta..."
            }
            className="flex-1 bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputValue.trim()}
            className="p-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
