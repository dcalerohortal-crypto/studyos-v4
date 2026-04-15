import { useState } from "react";

interface StepOption {
  id: string;
  label: string;
  icon?: string;
  variant?: "primary" | "secondary" | "outline";
}

interface StepControlsProps {
  pasoActual: number;
  totalPasos: number;
  esperandoConfirmacion?: boolean;
  opciones?: StepOption[];
  onContinuar?: () => void;
  onOpcionClick?: (opcionId: string) => void;
  onPreguntaChange?: (pregunta: string) => void;
  placeholderPregunta?: string;
}

export default function StepControls({
  pasoActual,
  totalPasos,
  esperandoConfirmacion = true,
  opciones = [
    {
      id: "continuar",
      label: "Continuar",
      icon: "▶️",
      variant: "primary" as const,
    },
    {
      id: "explicar_mas",
      label: "Explícame más",
      icon: "📝",
      variant: "secondary" as const,
    },
    {
      id: "ejemplo",
      label: "Dame un ejemplo",
      icon: "🔄",
      variant: "outline" as const,
    },
    {
      id: "pregunta",
      label: "Tengo una duda",
      icon: "❓",
      variant: "outline" as const,
    },
  ],
  onContinuar,
  onOpcionClick,
  onPreguntaChange,
  placeholderPregunta = "¿Qué quieres saber?",
}: StepControlsProps) {
  const [preguntaAbierta, setPreguntaAbierta] = useState(false);
  const [pregunta, setPregunta] = useState("");

  const handlePreguntaSubmit = () => {
    if (pregunta.trim()) {
      onPreguntaChange?.(pregunta);
      setPregunta("");
      setPreguntaAbierta(false);
    }
  };

  const togglePregunta = () => {
    setPreguntaAbierta(!preguntaAbierta);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Paso {pasoActual + 1} de {totalPasos}
        </span>
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((pasoActual + 1) / totalPasos) * 100}%` }}
          />
        </div>
      </div>

      {esperandoConfirmacion && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {opciones.map(opcion => (
              <button
                key={opcion.id}
                onClick={() => {
                  if (opcion.id === "pregunta") {
                    togglePregunta();
                  } else if (opcion.id === "continuar") {
                    onContinuar?.();
                  } else {
                    onOpcionClick?.(opcion.id);
                  }
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200 hover:scale-105 active:scale-95
                  ${
                    opcion.variant === "primary"
                      ? "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25"
                      : opcion.variant === "secondary"
                        ? "bg-secondary/80 text-foreground hover:bg-secondary border border-border/50"
                        : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-border/30"
                  }
                `}
              >
                {opcion.icon && <span>{opcion.icon}</span>}
                {opcion.label}
              </button>
            ))}
          </div>

          {preguntaAbierta && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pregunta}
                  onChange={e => setPregunta(e.target.value)}
                  placeholder={placeholderPregunta}
                  className="flex-1 px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePreguntaSubmit();
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handlePreguntaSubmit}
                  disabled={!pregunta.trim()}
                  className="px-4 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </button>
                <button
                  onClick={togglePregunta}
                  className="px-3 py-3 bg-secondary/50 rounded-xl text-sm hover:bg-secondary transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Presiona Enter para enviar
              </p>
            </div>
          )}
        </div>
      )}

      {!esperandoConfirmacion && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Cargando siguiente paso...
        </div>
      )}
    </div>
  );
}
