import { useState, useEffect, useRef } from "react";
import {
  Notebook,
  GeneratedContent,
  NotebookDocument,
  URLSource,
} from "@/types";
import {
  FileText,
  BookOpen,
  Headphones,
  BarChart3,
  HelpCircle,
  Loader,
  Plus,
  Link,
  Youtube,
  Globe,
  Image,
  File,
  CheckSquare,
  Square,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileWarning,
  ArrowLeft,
} from "lucide-react";
import {
  generateSummary,
  generateFlashcards,
  generateTest,
  generateDiagram,
} from "@/lib/contentGenerator";
import { generatePodcast, PodcastConfig } from "@/lib/podcastGenerator";
import {
  getAllDocumentsText,
  ContentSource,
  ExtractionResult,
  formatExtractionResults,
} from "@/lib/contentProcessor";
import { chatWithAI } from "@/lib/apiClient";
import { AIProvider } from "@/lib/apiClient";
import ContentModal from "./ContentModal";
import AddSourceModal from "./AddSourceModal";
import PodcastViewer from "./PodcastViewer";
import TopicContextModal from "./TopicContextModal";
import PodcastConfigModal from "./PodcastConfigModal";
import PodcastQueue from "./PodcastQueue";
import { useGameState } from "@/hooks/useGameState";

interface Props {
  notebook: Notebook;
  onUpdateNotebook: (notebook: Notebook) => void;
}

interface SourceItem {
  id: string;
  type: "document" | "youtube" | "url";
  name: string;
  icon: React.ReactNode;
  onDelete: () => void;
}

const MAX_SOURCES = 5;

export default function NotebookRightPanelFull({
  notebook,
  onUpdateNotebook,
}: Props) {
  const { addXP } = useGameState();
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] =
    useState<GeneratedContent | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>(
    notebook.generatedContent || []
  );
  const [showAddSource, setShowAddSource] = useState(false);
  const [urlSources, setUrlSources] = useState<URLSource[]>(
    notebook.urlSources || []
  );
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [extractionResults, setExtractionResults] = useState<
    ExtractionResult[]
  >([]);
  const [extractedText, setExtractedText] = useState<string>("");
  const [showExtractionPreview, setShowExtractionPreview] = useState(false);
  const [currentExtractionProgress, setCurrentExtractionProgress] =
    useState<string>("");
  const [activeProvider, setActiveProvider] = useState<AIProvider | null>(null);
  const [providerStatus, setProviderStatus] = useState<string>("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<string | null>(
    null
  );
  const [topicContext, setTopicContext] = useState<string>("");
  const [showPodcastConfig, setShowPodcastConfig] = useState(false);
  const [currentPodcastJobId, setCurrentPodcastJobId] = useState<string | null>(
    null
  );
  const [currentPodcastStatus, setCurrentPodcastStatus] = useState<string>("");
  const [currentPodcastProgress, setCurrentPodcastProgress] =
    useState<number>(0);
  const [currentPodcastScript, setCurrentPodcastScript] = useState<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const allSources: SourceItem[] = [
    ...notebook.documents.map(
      (doc): SourceItem => ({
        id: doc.id,
        type: "document" as const,
        name: doc.name,
        icon:
          doc.type === "pdf" ? (
            <FileText className="w-4 h-4 text-red-500" />
          ) : doc.type === "image" ? (
            <Image className="w-4 h-4 text-green-500" />
          ) : (
            <File className="w-4 h-4 text-blue-500" />
          ),
        onDelete: () => {
          const updated = notebook.documents.filter(d => d.id !== doc.id);
          onUpdateNotebook({ ...notebook, documents: updated });
          setSelectedSourceIds(prev => prev.filter(id => id !== doc.id));
        },
      })
    ),
    ...urlSources.map(
      (url): SourceItem => ({
        id: url.id,
        type: url.type as "youtube" | "url",
        name: url.name,
        icon:
          url.type === "youtube" ? (
            <Youtube className="w-4 h-4 text-red-500" />
          ) : (
            <Globe className="w-4 h-4 text-blue-500" />
          ),
        onDelete: () => {
          const updated = urlSources.filter(u => u.id !== url.id);
          setUrlSources(updated);
          onUpdateNotebook({ ...notebook, urlSources: updated });
          setSelectedSourceIds(prev => prev.filter(id => id !== url.id));
        },
      })
    ),
  ];

  const toggleSource = (id: string) => {
    setSelectedSourceIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      if (prev.length >= MAX_SOURCES) {
        alert(`Máximo ${MAX_SOURCES} fuentes para generar contenido`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const selectAll = () => {
    const ids = allSources.slice(0, MAX_SOURCES).map(s => s.id);
    setSelectedSourceIds(ids);
  };

  const deselectAll = () => {
    setSelectedSourceIds([]);
  };

  const getSelectedSources = (): SourceItem[] => {
    if (selectedSourceIds.length === 0) {
      return allSources.slice(0, MAX_SOURCES);
    }
    return allSources.filter(s => selectedSourceIds.includes(s.id));
  };

  const extractContent = async (
    selectedItems: SourceItem[],
    onProgress?: (status: string) => void
  ): Promise<{ text: string; results: ExtractionResult[] } | null> => {
    const docsAsSources: ContentSource[] = selectedItems
      .filter(s => s.type === "document")
      .map(s => {
        const doc = notebook.documents.find(d => d.id === s.id)!;
        return {
          type: doc.type as "pdf" | "image" | "document",
          name: doc.name,
          data: doc.fileData as string | ArrayBuffer | Uint8Array,
        };
      });

    const urlsAsSources: ContentSource[] = selectedItems
      .filter(s => s.type !== "document")
      .map(s => {
        const url = urlSources.find(u => u.id === s.id)!;
        return {
          type: url.type as "youtube" | "url",
          name: url.name,
          url: url.url,
        };
      });

    const sources = [...docsAsSources, ...urlsAsSources];

    const extraction = await getAllDocumentsText(
      sources,
      (sourceName, status) => {
        setCurrentExtractionProgress(`${sourceName}: ${status}`);
        onProgress?.(`${sourceName}: ${status}`);
      }
    );

    setExtractionResults(extraction.results);
    setExtractedText(extraction.text);
    setShowExtractionPreview(true);

    const failedCount = extraction.results.filter(
      r => r.status === "failed"
    ).length;
    if (failedCount > 0 && extraction.text.length < 100) {
      const failedSources = extraction.results
        .filter(r => r.status === "failed")
        .map(r => `${r.source}: ${r.error}`)
        .join("\n");
      alert(
        `No se pudo extraer contenido de ${failedCount} fuente(s):\n\n${failedSources}\n\nPor favor, verifica que los archivos sean legibles o prueba con otros formatos.`
      );
      return null;
    }

    if (extraction.text.length < 50) {
      alert(
        "El contenido extraído es muy corto. Verifica que los archivos contengan texto legible."
      );
      return null;
    }

    return extraction;
  };

  const openTopicModal = (type: string) => {
    if (allSources.length === 0) {
      alert("Añade documentos o URLs primero");
      return;
    }
    setPendingGeneration(type);
    setShowTopicModal(true);
  };

  const handleGenerateWithContext = (context: string) => {
    setShowTopicModal(false);
    const type = pendingGeneration;
    setPendingGeneration(null);

    if (type === "summary") {
      handleGenerateSummaryInternal(context);
    } else if (type === "flashcards") {
      handleGenerateFlashcardsInternal(context);
    } else if (type === "test") {
      handleGenerateTestInternal(context);
    } else if (type === "mindmap") {
      handleGenerateDiagramInternal(context);
    }
  };

  const handleGenerateSummaryInternal = async (topicContext?: string) => {
    setGenerating("summary");
    setProcessingStatus("Extrayendo contenido...");
    setShowExtractionPreview(false);
    setExtractionResults([]);
    setExtractedText("");
    setActiveProvider(null);
    setIsRetrying(false);
    setProviderStatus("");
    try {
      const selectedItems = getSelectedSources();
      const extraction = await extractContent(selectedItems, status => {
        setProcessingStatus(status);
      });

      if (!extraction) {
        setGenerating(null);
        setProcessingStatus(null);
        return;
      }

      setProcessingStatus("Generando resumen con IA...");
      const summary = await generateSummary(
        extraction.text,
        notebook.name,
        {
          onProviderChange: provider => {
            setActiveProvider(provider);
            setProviderStatus(
              `Usando ${provider === "gemini" ? "Gemini" : "Groq"}`
            );
          },
          onRetrying: (provider, attempt, maxRetries) => {
            setIsRetrying(true);
            setProviderStatus(
              `${provider === "gemini" ? "Gemini" : "Groq"} ocupado, reintentando (${attempt}/${maxRetries})...`
            );
          },
          onFallback: (from, to) => {
            setProviderStatus(`Fallback: ${from} → ${to}`);
          },
        },
        topicContext
      );

      if (summary) {
        const updated = [summary, ...generatedContent];
        setGeneratedContent(updated);
        setSelectedContent(summary);
        onUpdateNotebook({
          ...notebook,
          generatedContent: updated,
          urlSources,
        });
        addXP(100, notebook.subjectId, `Resumen generado: ${notebook.name}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar resumen");
    } finally {
      setGenerating(null);
      setProcessingStatus(null);
      setProviderStatus("");
      setCurrentExtractionProgress("");
      setActiveProvider(null);
      setIsRetrying(false);
    }
  };

  const handleGenerateFlashcardsInternal = async (topicContext?: string) => {
    setGenerating("flashcards");
    setProcessingStatus("Extrayendo contenido...");
    setShowExtractionPreview(false);
    setExtractionResults([]);
    setExtractedText("");
    setActiveProvider(null);
    setIsRetrying(false);
    setProviderStatus("");
    try {
      const selectedItems = getSelectedSources();
      const extraction = await extractContent(selectedItems, status => {
        setProcessingStatus(status);
      });

      if (!extraction) {
        setGenerating(null);
        setProcessingStatus(null);
        return;
      }

      setProcessingStatus("Generando flashcards con IA...");
      const flashcards = await generateFlashcards(
        extraction.text,
        notebook.name,
        20,
        {
          onProviderChange: provider => {
            setActiveProvider(provider);
            setProviderStatus(
              `Usando ${provider === "gemini" ? "Gemini" : "Groq"}`
            );
          },
          onRetrying: (provider, attempt, maxRetries) => {
            setIsRetrying(true);
            setProviderStatus(
              `${provider === "gemini" ? "Gemini" : "Groq"} ocupado, reintentando (${attempt}/${maxRetries})...`
            );
          },
          onFallback: (from, to) => {
            setProviderStatus(
              `Fallback: ${from === "gemini" ? "Gemini" : "Groq"} → ${to === "gemini" ? "Gemini" : "Groq"}`
            );
          },
        },
        topicContext
      );
      if (flashcards) {
        const updated = [flashcards, ...generatedContent];
        setGeneratedContent(updated);
        setSelectedContent(flashcards);
        onUpdateNotebook({
          ...notebook,
          generatedContent: updated,
          urlSources,
        });
        addXP(150, notebook.subjectId, `Flashcards generadas: ${notebook.name}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar flashcards");
    } finally {
      setGenerating(null);
      setProcessingStatus(null);
      setProviderStatus("");
      setCurrentExtractionProgress("");
      setActiveProvider(null);
      setIsRetrying(false);
    }
  };

  const handleGenerateTestInternal = async (topicContext?: string) => {
    setGenerating("test");
    setProcessingStatus("Extrayendo contenido...");
    setShowExtractionPreview(false);
    setExtractionResults([]);
    setExtractedText("");
    setActiveProvider(null);
    setIsRetrying(false);
    setProviderStatus("");
    try {
      const selectedItems = getSelectedSources();
      const extraction = await extractContent(selectedItems, status => {
        setProcessingStatus(status);
      });

      if (!extraction) {
        setGenerating(null);
        setProcessingStatus(null);
        return;
      }

      setProcessingStatus("Generando test con IA...");
      const test = await generateTest(
        extraction.text,
        notebook.name,
        5,
        {
          onProviderChange: provider => {
            setActiveProvider(provider);
            setProviderStatus(
              `Usando ${provider === "gemini" ? "Gemini" : "Groq"}`
            );
          },
          onRetrying: (provider, attempt, maxRetries) => {
            setIsRetrying(true);
            setProviderStatus(
              `${provider === "gemini" ? "Gemini" : "Groq"} ocupado, reintentando (${attempt}/${maxRetries})...`
            );
          },
          onFallback: (from, to) => {
            setProviderStatus(
              `Fallback: ${from === "gemini" ? "Gemini" : "Groq"} → ${to === "gemini" ? "Gemini" : "Groq"}`
            );
          },
        },
        topicContext
      );
      if (test) {
        const updated = [test, ...generatedContent];
        setGeneratedContent(updated);
        setSelectedContent(test);
        onUpdateNotebook({
          ...notebook,
          generatedContent: updated,
          urlSources,
        });
        addXP(100, notebook.subjectId, `Test generado: ${notebook.name}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar test");
    } finally {
      setGenerating(null);
      setProcessingStatus(null);
      setProviderStatus("");
      setCurrentExtractionProgress("");
      setActiveProvider(null);
      setIsRetrying(false);
    }
  };

  const handleGenerateDiagramInternal = async (topicContext?: string) => {
    setGenerating("mindmap");
    setProcessingStatus("Extrayendo contenido...");
    setShowExtractionPreview(false);
    setExtractionResults([]);
    setExtractedText("");
    setActiveProvider(null);
    setIsRetrying(false);
    setProviderStatus("");
    try {
      const selectedItems = getSelectedSources();
      const extraction = await extractContent(selectedItems, status => {
        setProcessingStatus(status);
      });

      if (!extraction) {
        setGenerating(null);
        setProcessingStatus(null);
        return;
      }

      setProcessingStatus("Generando esquema con IA...");
      const diagram = await generateDiagram(
        extraction.text,
        notebook.name,
        {
          onProviderChange: provider => {
            setActiveProvider(provider);
            setProviderStatus(
              `Usando ${provider === "gemini" ? "Gemini" : "Groq"}`
            );
          },
          onRetrying: (provider, attempt, maxRetries) => {
            setIsRetrying(true);
            setProviderStatus(
              `${provider === "gemini" ? "Gemini" : "Groq"} ocupado, reintentando (${attempt}/${maxRetries})...`
            );
          },
          onFallback: (from, to) => {
            setProviderStatus(
              `Fallback: ${from === "gemini" ? "Gemini" : "Groq"} → ${to === "gemini" ? "Gemini" : "Groq"}`
            );
          },
        },
        topicContext
      );
      if (diagram) {
        const updated = [diagram, ...generatedContent];
        setGeneratedContent(updated);
        setSelectedContent(diagram);
        onUpdateNotebook({
          ...notebook,
          generatedContent: updated,
          urlSources,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar esquema");
    } finally {
      setGenerating(null);
      setProcessingStatus(null);
      setProviderStatus("");
      setCurrentExtractionProgress("");
      setActiveProvider(null);
      setIsRetrying(false);
    }
  };

  const handleGeneratePodcast = async (config: PodcastConfig) => {
    if (allSources.length === 0) {
      alert("Añade documentos o URLs primero");
      return;
    }
    setShowPodcastConfig(false);
    setGenerating("podcast");
    setProcessingStatus("Extrayendo contenido...");
    setShowExtractionPreview(false);
    setExtractionResults([]);
    setExtractedText("");
    try {
      const selectedItems = getSelectedSources();
      const extraction = await extractContent(selectedItems, status => {
        setProcessingStatus(status);
      });

      if (!extraction) {
        setGenerating(null);
        setProcessingStatus(null);
        return;
      }

      setProcessingStatus("Enviando a procesamiento en segundo plano...");

      const response = await fetch("/api/podcast-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          documentText: extraction.text,
          notebookName: notebook.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear job");
      }

      const { jobId } = await response.json();

      setCurrentPodcastJobId(jobId);
      setCurrentPodcastStatus("queued");
      setCurrentPodcastProgress(0);
      setCurrentPodcastScript(null);

      setGenerating(null);
      setProcessingStatus(null);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar podcast");
      setGenerating(null);
      setProcessingStatus(null);
    }
  };

  const pollPodcastStatus = async () => {
    if (!currentPodcastJobId) return;

    try {
      const response = await fetch(
        `/api/podcast-status?job_id=${currentPodcastJobId}`
      );

      if (!response.ok) {
        throw new Error("Error fetching status");
      }

      const data = await response.json();

      setCurrentPodcastStatus(data.status);
      setCurrentPodcastProgress(data.progress);

      if (data.script) {
        setCurrentPodcastScript(data.script);
      }

      if (
        data.status === "completed" ||
        data.status === "error" ||
        data.status === "cancelled"
      ) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }

      if (data.status === "completed" && data.audioUrl && data.script) {
        const podcast = {
          id: `podcast-${Date.now()}`,
          type: "podcast" as const,
          title: `Podcast - ${notebook.name}`,
          content: {
            audioUrl: data.audioUrl,
            script: data.script,
            duration: Math.round(data.progress / 2),
          },
          createdAt: new Date().toISOString(),
        };

        const updated = [podcast, ...generatedContent];
        setGeneratedContent(updated);
        setSelectedContent(podcast);
        onUpdateNotebook({
          ...notebook,
          generatedContent: updated,
          urlSources,
        });
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  useEffect(() => {
    if (currentPodcastJobId) {
      pollPodcastStatus();
      pollingRef.current = setInterval(pollPodcastStatus, 5000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [currentPodcastJobId]);

  const handleCancelPodcast = async () => {
    if (!currentPodcastJobId) return;

    try {
      await fetch(`/api/podcast-status?job_id=${currentPodcastJobId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Cancel error:", error);
    }

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    setCurrentPodcastJobId(null);
    setCurrentPodcastStatus("");
    setCurrentPodcastProgress(0);
    setCurrentPodcastScript(null);
  };

  const handlePodcastComplete = (audioUrl: string, script: any[]) => {
    setCurrentPodcastJobId(null);
    setCurrentPodcastStatus("");
    setCurrentPodcastProgress(0);
    setCurrentPodcastScript(null);
    if (audioUrl && script.length > 0) {
      const podcast = generatedContent.find(c => c.type === "podcast");
      if (podcast) {
        setSelectedContent(podcast);
      }
    }
  };

  const handlePodcastError = (error: string) => {
    setCurrentPodcastJobId(null);
    setCurrentPodcastStatus("");
    setCurrentPodcastProgress(0);
    setCurrentPodcastScript(null);
  };

  const openPodcastConfig = () => {
    if (allSources.length === 0) {
      alert("Añade documentos o URLs primero");
      return;
    }
    setShowPodcastConfig(true);
  };

  const handleAddUrlSource = (source: URLSource) => {
    const updated = [source, ...urlSources];
    setUrlSources(updated);
    onUpdateNotebook({ ...notebook, urlSources: updated });
  };

  const handleRemoveUrlSource = (index: number) => {
    const updated = urlSources.filter((_, i) => i !== index);
    setUrlSources(updated);
    onUpdateNotebook({ ...notebook, urlSources: updated });
  };

  const GENERATION_TOOLS = [
    {
      id: "summary",
      label: "Resumen",
      icon: <FileText className="w-6 h-6" />,
      description: "Resumen interactivo",
      color: "from-blue-500 to-blue-600",
      handler: () => openTopicModal("summary"),
    },
    {
      id: "flashcards",
      label: "Flashcards",
      icon: <BookOpen className="w-6 h-6" />,
      description: "Tarjetas de estudio",
      color: "from-purple-500 to-purple-600",
      handler: () => openTopicModal("flashcards"),
    },
    {
      id: "mindmap",
      label: "Esquema",
      icon: <BarChart3 className="w-6 h-6" />,
      description: "Mapa mental",
      color: "from-green-500 to-green-600",
      handler: () => openTopicModal("mindmap"),
    },
    {
      id: "podcast",
      label: "Podcast",
      icon: <Headphones className="w-6 h-6" />,
      description: "Audio conversacional",
      color: "from-orange-500 to-orange-600",
      handler: openPodcastConfig,
    },
    {
      id: "test",
      label: "Test",
      icon: <HelpCircle className="w-6 h-6" />,
      description: "Examen interactivo",
      color: "from-red-500 to-red-600",
      handler: () => openTopicModal("test"),
    },
  ];

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground mb-1">Studio</h2>
        <p className="text-xs text-muted-foreground">
          {generatedContent.length} contenido
          {generatedContent.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Sources Section */}
      <div className="p-4 border-b border-border bg-secondary/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">
            Fuentes ({selectedSourceIds.length || allSources.length}/
            {MAX_SOURCES})
          </h3>
          <div className="flex gap-1">
            <button
              onClick={selectAll}
              disabled={allSources.length === 0}
              className="text-xs px-2 py-1 hover:bg-secondary rounded transition-colors disabled:opacity-50"
              title="Seleccionar hasta 5"
            >
              Todos
            </button>
            {selectedSourceIds.length > 0 && (
              <button
                onClick={deselectAll}
                className="text-xs px-2 py-1 hover:bg-secondary rounded transition-colors"
              >
                Ninguno
              </button>
            )}
          </div>
        </div>

        {/* Add Source Button */}
        <button
          onClick={() => setShowAddSource(true)}
          className="w-full mb-3 p-2 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Añadir fuente
        </button>

        {/* Source List */}
        {allSources.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {allSources.map(source => (
              <div
                key={source.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedSourceIds.includes(source.id)
                    ? "bg-accent/20 border border-accent/40"
                    : "bg-secondary/30 hover:bg-secondary/50"
                }`}
                onClick={() => toggleSource(source.id)}
              >
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleSource(source.id);
                  }}
                  className="flex-shrink-0"
                >
                  {selectedSourceIds.includes(source.id) ? (
                    <CheckSquare className="w-4 h-4 text-accent" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <span className="flex-shrink-0">{source.icon}</span>
                <span className="text-xs truncate flex-1" title={source.name}>
                  {source.name}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    source.onDelete();
                  }}
                  className="flex-shrink-0 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            Añade documentos o URLs para generar contenido
          </p>
        )}
      </div>

      {/* Processing Status */}
      {processingStatus && (
        <div className="px-4 py-2 bg-accent/10 border-b border-accent/20">
          <div className="flex items-center gap-2 text-sm text-accent">
            <Loader className="w-4 h-4 animate-spin" />
            <span>{processingStatus}</span>
          </div>
        </div>
      )}

      {/* Provider Status */}
      {providerStatus && (
        <div
          className={`px-4 py-2 border-b transition-colors ${
            isRetrying
              ? "bg-yellow-500/10 border-yellow-500/20"
              : activeProvider === "gemini"
                ? "bg-green-500/10 border-green-500/20"
                : "bg-blue-500/10 border-blue-500/20"
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs ${
              isRetrying
                ? "text-yellow-400"
                : activeProvider === "gemini"
                  ? "text-green-400"
                  : "text-blue-400"
            }`}
          >
            {isRetrying ? (
              <AlertCircle className="w-3 h-3" />
            ) : activeProvider === "gemini" ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            )}
            <span className={isRetrying ? "animate-pulse" : ""}>
              {providerStatus}
            </span>
            {isRetrying && <Loader className="w-3 h-3 animate-spin ml-auto" />}
          </div>
        </div>
      )}

      {/* Extraction Progress */}
      {currentExtractionProgress && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <Loader className="w-3 h-3 animate-spin" />
            <span className="truncate">{currentExtractionProgress}</span>
          </div>
        </div>
      )}

      {/* Extraction Results Preview */}
      {showExtractionPreview && extractionResults.length > 0 && (
        <div className="border-b border-border bg-secondary/10">
          <button
            onClick={() => setShowExtractionPreview(!showExtractionPreview)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs hover:bg-secondary/20 transition-colors"
          >
            <span className="font-medium text-muted-foreground">
              Contenido extraído
            </span>
            {showExtractionPreview ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showExtractionPreview && (
            <div className="px-4 pb-3 space-y-2">
              {/* Summary stats */}
              <div className="flex items-center gap-4 text-xs">
                {(() => {
                  const stats = formatExtractionResults(extractionResults);
                  return (
                    <>
                      <span className="text-green-400">
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        {stats.success}
                      </span>
                      {stats.failed && (
                        <span className="text-red-400">
                          <XCircle className="w-3 h-3 inline mr-1" />
                          {stats.failed}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {stats.totalChars.toLocaleString()} caracteres
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Individual source results */}
              <div className="space-y-1">
                {extractionResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded text-xs ${
                      result.status === "success"
                        ? "bg-green-500/10"
                        : result.status === "fallback"
                          ? "bg-yellow-500/10"
                          : "bg-red-500/10"
                    }`}
                  >
                    {result.status === "success" && (
                      <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    )}
                    {result.status === "fallback" && (
                      <FileWarning className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                    )}
                    {result.status === "failed" && (
                      <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.source}</p>
                      {result.status === "failed" ? (
                        <p className="text-red-400 truncate">{result.error}</p>
                      ) : (
                        <p className="text-muted-foreground line-clamp-2">
                          {result.preview || "(contenido extraído)"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Generation Tools */}
        <div className="p-4 space-y-3 border-b border-border">
          {GENERATION_TOOLS.map(tool => {
            return (
              <button
                key={tool.id}
                onClick={tool.handler}
                disabled={generating !== null || allSources.length === 0}
                className={`w-full p-4 rounded-lg transition-all text-left disabled:opacity-50 ${
                  generating === tool.id
                    ? `bg-gradient-to-r ${tool.color} text-white`
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={
                      generating === tool.id
                        ? "text-white animate-spin"
                        : "text-accent"
                    }
                  >
                    {generating === tool.id ? (
                      <Loader className="w-6 h-6" />
                    ) : (
                      tool.icon
                    )}
                  </div>
                  <div
                    className={
                      generating === tool.id ? "text-white" : "text-foreground"
                    }
                  >
                    <p className="font-semibold text-sm">{tool.label}</p>
                    <p
                      className={`text-xs ${generating === tool.id ? "text-white/70" : "text-muted-foreground"}`}
                    >
                      {generating === tool.id
                        ? "Generando..."
                        : tool.description}
                      {generating !== tool.id && allSources.length > 0 && (
                        <span className="ml-1 text-accent/60">
                          ({selectedSourceIds.length || allSources.length}{" "}
                          fuente
                          {selectedSourceIds.length !== 1 &&
                          allSources.length !== 1
                            ? "s"
                            : ""}
                          )
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Generated Content List */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {generatedContent.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Los resultados de Studio se guardarán aquí.
            </p>
          ) : (
            generatedContent.map(content => (
              <button
                key={content.id}
                onClick={() => setSelectedContent(content)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedContent?.id === content.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                <div className="flex items-start gap-2">
                  {content.type === "summary" && (
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  {content.type === "flashcards" && (
                    <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  {content.type === "test" && (
                    <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  {content.type === "mindmap" && (
                    <BarChart3 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  {content.type === "podcast" && (
                    <Headphones className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {content.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(content.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Modal for content viewing */}
      {selectedContent && (
        <ContentModal
          content={selectedContent}
          notebookId={notebook.id}
          subjectId={notebook.subjectId}
          onClose={() => setSelectedContent(null)}
        />
      )}

      {/* Add Source Modal */}
      {showAddSource && (
        <AddSourceModal
          onAdd={handleAddUrlSource}
          onClose={() => setShowAddSource(false)}
        />
      )}

      {/* Topic Context Modal */}
      {showTopicModal && (
        <TopicContextModal
          isOpen={showTopicModal}
          onClose={() => {
            setShowTopicModal(false);
            setPendingGeneration(null);
          }}
          onConfirm={handleGenerateWithContext}
          type={
            (pendingGeneration as
              | "summary"
              | "flashcards"
              | "mindmap"
              | "test") || "summary"
          }
        />
      )}

      {/* Podcast Config Modal */}
      <PodcastConfigModal
        isOpen={showPodcastConfig}
        onClose={() => setShowPodcastConfig(false)}
        onConfirm={handleGeneratePodcast}
      />

      {/* Podcast Queue Modal */}
      {currentPodcastJobId && (
        <PodcastQueue
          jobId={currentPodcastJobId}
          status={currentPodcastStatus}
          progress={currentPodcastProgress}
          onCancel={handleCancelPodcast}
          onComplete={handlePodcastComplete}
          onError={handlePodcastError}
          notebookName={notebook.name}
        />
      )}
    </div>
  );
}
