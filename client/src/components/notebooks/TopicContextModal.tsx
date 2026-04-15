import { useState } from "react";
import { X, Sparkles } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (context: string) => void;
  type: "summary" | "flashcards" | "mindmap" | "test";
}

const LABELS = {
  summary: "Resumen",
  flashcards: "Flashcards",
  mindmap: "Esquema",
  test: "Test",
};

const DESCRIPTIONS = {
  summary: "Sobre qué tema quieres el resumen",
  flashcards: "Qué conceptos quieres que cubran las tarjetas",
  mindmap: "Qué tema quieres que cubra el mapa mental",
  test: "Qué materia quieres que cubra el examen",
};

export default function TopicContextModal({
  isOpen,
  onClose,
  onConfirm,
  type,
}: Props) {
  const [context, setContext] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(context.trim());
    setContext("");
  };

  const handleClose = () => {
    setContext("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleConfirm();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-gradient-to-r from-accent/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Generar {LABELS[type]}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {DESCRIPTIONS[type]}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <label className="block text-sm font-medium text-foreground mb-2">
            ¿En qué te quieres centrar?
          </label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder={`Ej: La Crisis de los Misiles, Ecuaciones de segundo grado, La Segunda Guerra Mundial...`}
            className="w-full h-28 px-4 py-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none transition-all"
            autoFocus
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {context ? (
              <span className="text-accent/80">
                Se generará sobre: <strong>"{context}"</strong>
              </span>
            ) : (
              "Deja vacío para generar sobre todo el documento"
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border bg-secondary/20 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-semibold bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            Generar
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
