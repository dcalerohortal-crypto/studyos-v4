import { useState } from "react";
import { Notebook, GeneratedContent } from "@/types";
import {
  FileText,
  BookOpen,
  Headphones,
  BarChart3,
  HelpCircle,
  Upload,
  Loader,
} from "lucide-react";
import {
  generateSummary,
  generateFlashcards,
  generateTest,
  generateDiagram,
} from "@/lib/contentGenerator";
import { getAllDocumentsText } from "@/lib/documentProcessor";
import TopicContextModal from "./TopicContextModal";

interface Props {
  notebook: Notebook;
}

type GenerationType = "summary" | "flashcards" | "mindmap" | "test";

export default function NotebookRightPanel({ notebook }: Props) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>(
    notebook.generatedContent || []
  );
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] =
    useState<GenerationType | null>(null);

  const openTopicModal = (type: GenerationType) => {
    if (notebook.documents.length === 0) {
      alert("Sube documentos primero");
      return;
    }
    setPendingGeneration(type);
    setShowTopicModal(true);
  };

  const handleGenerateWithContext = async (context: string) => {
    if (!pendingGeneration) return;

    setGenerating(pendingGeneration);
    setShowTopicModal(false);

    try {
      const documentText = await getAllDocumentsText(notebook.documents);

      switch (pendingGeneration) {
        case "summary": {
          const summary = await generateSummary(
            documentText,
            notebook.name,
            undefined,
            context || undefined
          );
          if (summary) {
            setGeneratedContent(prev => [summary, ...prev]);
          }
          break;
        }
        case "flashcards": {
          const flashcards = await generateFlashcards(
            documentText,
            notebook.name,
            10,
            undefined,
            context || undefined
          );
          if (flashcards) {
            setGeneratedContent(prev => [flashcards, ...prev]);
          }
          break;
        }
        case "mindmap": {
          const diagram = await generateDiagram(
            documentText,
            notebook.name,
            undefined,
            context || undefined
          );
          if (diagram) {
            setGeneratedContent(prev => [diagram, ...prev]);
          }
          break;
        }
        case "test": {
          const test = await generateTest(
            documentText,
            notebook.name,
            5,
            undefined,
            context || undefined
          );
          if (test) {
            setGeneratedContent(prev => [test, ...prev]);
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar contenido");
    } finally {
      setGenerating(null);
      setPendingGeneration(null);
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground mb-2">Generar</h2>
        <p className="text-xs text-muted-foreground">
          {notebook.documents.length} documento
          {notebook.documents.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Upload Section */}
      <div className="p-4 border-b border-border">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="w-full bg-accent/10 hover:bg-accent/20 text-accent rounded-lg px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4" />
          Subir Archivo
        </button>
        {showUpload && (
          <div className="mt-3 p-3 bg-secondary rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              PDF, imágenes, documentos
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
              className="w-full text-xs"
            />
          </div>
        )}
      </div>

      {/* Generation Tools */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Resumen */}
        <button
          onClick={() => openTopicModal("summary")}
          disabled={generating !== null || notebook.documents.length === 0}
          className={`w-full p-4 rounded-lg transition-all text-left disabled:opacity-50 ${
            generating === "summary"
              ? "bg-gradient-to-r from-blue-500 to-blue-600"
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={
                generating === "summary"
                  ? "text-white animate-spin"
                  : "text-accent"
              }
            >
              {generating === "summary" ? (
                <Loader className="w-6 h-6" />
              ) : (
                <FileText className="w-6 h-6" />
              )}
            </div>
            <div
              className={
                generating === "summary" ? "text-white" : "text-foreground"
              }
            >
              <p className="font-semibold text-sm">Resumen</p>
              <p
                className={`text-xs ${generating === "summary" ? "text-white/70" : "text-muted-foreground"}`}
              >
                {generating === "summary"
                  ? "Generando..."
                  : "Resumen interactivo"}
              </p>
            </div>
          </div>
        </button>

        {/* Flashcards */}
        <button
          onClick={() => openTopicModal("flashcards")}
          disabled={generating !== null || notebook.documents.length === 0}
          className={`w-full p-4 rounded-lg transition-all text-left disabled:opacity-50 ${
            generating === "flashcards"
              ? "bg-gradient-to-r from-purple-500 to-purple-600"
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={
                generating === "flashcards"
                  ? "text-white animate-spin"
                  : "text-accent"
              }
            >
              {generating === "flashcards" ? (
                <Loader className="w-6 h-6" />
              ) : (
                <BookOpen className="w-6 h-6" />
              )}
            </div>
            <div
              className={
                generating === "flashcards" ? "text-white" : "text-foreground"
              }
            >
              <p className="font-semibold text-sm">Flashcards</p>
              <p
                className={`text-xs ${generating === "flashcards" ? "text-white/70" : "text-muted-foreground"}`}
              >
                {generating === "flashcards"
                  ? "Generando..."
                  : "Tarjetas de estudio"}
              </p>
            </div>
          </div>
        </button>

        {/* Esquema */}
        <button
          onClick={() => openTopicModal("mindmap")}
          disabled={generating !== null || notebook.documents.length === 0}
          className={`w-full p-4 rounded-lg transition-all text-left disabled:opacity-50 ${
            generating === "mindmap"
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={
                generating === "mindmap"
                  ? "text-white animate-spin"
                  : "text-accent"
              }
            >
              {generating === "mindmap" ? (
                <Loader className="w-6 h-6" />
              ) : (
                <BarChart3 className="w-6 h-6" />
              )}
            </div>
            <div
              className={
                generating === "mindmap" ? "text-white" : "text-foreground"
              }
            >
              <p className="font-semibold text-sm">Esquema</p>
              <p
                className={`text-xs ${generating === "mindmap" ? "text-white/70" : "text-muted-foreground"}`}
              >
                {generating === "mindmap" ? "Generando..." : "Mapa mental"}
              </p>
            </div>
          </div>
        </button>

        {/* Podcast (Próximamente) */}
        <button
          disabled
          className="w-full p-4 rounded-lg transition-all text-left opacity-50 bg-secondary"
        >
          <div className="flex items-start gap-3">
            <div className="text-muted-foreground">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="text-foreground">
              <p className="font-semibold text-sm">Podcast</p>
              <p className="text-xs text-muted-foreground">Próximamente</p>
            </div>
          </div>
        </button>

        {/* Test */}
        <button
          onClick={() => openTopicModal("test")}
          disabled={generating !== null || notebook.documents.length === 0}
          className={`w-full p-4 rounded-lg transition-all text-left disabled:opacity-50 ${
            generating === "test"
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={
                generating === "test"
                  ? "text-white animate-spin"
                  : "text-accent"
              }
            >
              {generating === "test" ? (
                <Loader className="w-6 h-6" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>
            <div
              className={
                generating === "test" ? "text-white" : "text-foreground"
              }
            >
              <p className="font-semibold text-sm">Test</p>
              <p
                className={`text-xs ${generating === "test" ? "text-white/70" : "text-muted-foreground"}`}
              >
                {generating === "test" ? "Generando..." : "Examen interactivo"}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Generated Content */}
      {generatedContent.length > 0 && (
        <div className="p-4 border-t border-border">
          <h3 className="font-semibold text-foreground text-sm mb-2">
            Generado
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {generatedContent.map(content => (
              <button
                key={content.id}
                className="w-full p-2 bg-secondary hover:bg-secondary/80 rounded-lg text-left text-xs transition-all"
              >
                <p className="font-medium text-foreground truncate">
                  {content.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  {new Date(content.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic Context Modal */}
      {pendingGeneration && (
        <TopicContextModal
          isOpen={showTopicModal}
          onClose={() => {
            setShowTopicModal(false);
            setPendingGeneration(null);
          }}
          onConfirm={handleGenerateWithContext}
          type={pendingGeneration}
        />
      )}
    </div>
  );
}
