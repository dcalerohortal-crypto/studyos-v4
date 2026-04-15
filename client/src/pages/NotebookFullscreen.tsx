import { useRoute, useLocation } from "wouter";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Notebook } from "@/types";
import { ArrowLeft } from "lucide-react";
import NotebookLeftPanelFull from "@/components/notebooks/NotebookLeftPanelFull";
import NotebookCenterPanelFull from "@/components/notebooks/NotebookCenterPanelFull";
import NotebookRightPanelTabs from "@/components/notebooks/NotebookRightPanelTabs";
import NotebookRightPanelFull from "@/components/notebooks/NotebookRightPanelFull";
import { useLayoutStore } from "@/hooks/useLayoutStore";
import { motion, AnimatePresence } from "framer-motion";

export default function NotebookFullscreen() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/notebooks/:id/fullscreen");
  const [notebooks, setNotebooks] = useLocalStorage<Notebook[]>(
    "studyos_notebooks",
    []
  );
  const { leftPanelOpen, toggleLeftPanel } = useLayoutStore();

  if (!match || !params?.id) {
    return <div>Cuaderno no encontrado</div>;
  }

  const notebook = notebooks.find(n => n.id === params.id);

  if (!notebook) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Cuaderno no encontrado</p>
          <button
            onClick={() => setLocation("/notebooks")}
            className="bg-accent text-accent-foreground rounded-lg px-6 py-2 font-semibold"
          >
            Volver a Cuadernos
          </button>
        </div>
      </div>
    );
  }

  function handleUpdateNotebook(updated: Notebook) {
    setNotebooks(notebooks.map(n => (n.id === notebook.id ? updated : n)));
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Minimal Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setLocation("/notebooks")}
          className="p-2 hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
          <span className="text-sm text-muted-foreground">Volver</span>
        </button>
        <h1 className="text-lg font-bold text-foreground">{notebook.name}</h1>
        <div className="w-12" />
      </div>

      {/* 3-Panel Layout - Full Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Documents Upload */}
        <NotebookLeftPanelFull
          notebook={notebook}
          onUpdateNotebook={handleUpdateNotebook}
        />

        {/* Center Panel - Chat */}
        <NotebookCenterPanelFull
          notebook={notebook}
          onUpdateNotebook={handleUpdateNotebook}
        />

        {/* Right Panel - Generation Tools */}
        <NotebookRightPanelFull
          notebook={notebook}
          onUpdateNotebook={handleUpdateNotebook}
        />
      </div>
    </div>
  );
}
