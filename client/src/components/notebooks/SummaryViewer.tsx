import { useState } from "react";
import { Check, Lightbulb, Zap, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { StructuredSummary } from "@/types";
import MathRenderer from "./MathRenderer";

interface SummaryViewerProps {
  title: string;
  content: string | StructuredSummary;
  onRead?: () => void;
}

function isStructuredSummary(
  content: string | StructuredSummary
): content is StructuredSummary {
  return typeof content === "object" && "idea_central" in content;
}

export default function SummaryViewer({
  title,
  content,
  onRead,
}: SummaryViewerProps) {
  const [read, setRead] = useState(false);

  const handleMarkAsRead = () => {
    setRead(true);
    onRead?.();
  };

  if (!isStructuredSummary(content)) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
              RESUMEN
            </span>
          </div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const summary = content as StructuredSummary;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
            RESUMEN
          </span>
        </div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Idea Central - Caja destacada */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-transparent" />
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-600" />
          <div className="relative p-5 pl-6">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                Idea Central
              </span>
            </div>
            <p className="text-lg font-medium text-foreground leading-relaxed">
              <MathRenderer content={summary.idea_central} />
            </p>
          </div>
        </motion.div>

        {/* Conceptos - Tarjetas individuales */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Conceptos Clave
          </h4>
          {summary.conceptos.map((concepto, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="bg-secondary/40 rounded-xl p-4 border border-border/50 hover:border-accent/30 transition-colors"
            >
              <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <MathRenderer content={concepto.titulo} />
              </h5>
              <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                <MathRenderer content={concepto.explicacion} />
              </p>
              {concepto.ejemplo && (
                <div className="flex items-start gap-2 bg-blue-500/5 rounded-lg p-3 border-l-2 border-blue-400/50">
                  <span className="text-blue-400/60 text-xs font-medium mt-0.5">
                    Ejemplo:
                  </span>
                  <p className="text-sm text-blue-300/80 italic leading-relaxed">
                    <MathRenderer content={concepto.ejemplo} />
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Conexion Final - Caja al final */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + summary.conceptos.length * 0.05 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-purple-600/5 to-transparent" />
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-purple-600" />
          <div className="relative p-5 pl-6">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                Conexión Final
              </span>
            </div>
            <p className="text-foreground/90 leading-relaxed">
              <MathRenderer content={summary.conexion_final} />
            </p>
          </div>
        </motion.div>
      </div>

      {/* Mark as read */}
      <div className="mt-6 pt-4 border-t border-border">
        {!read ? (
          <button
            onClick={handleMarkAsRead}
            className="w-full py-3 bg-accent hover:bg-accent/80 text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-5 h-5" />
            Marcar como leído (+10 XP)
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Check className="w-5 h-5" />
            <span className="font-medium">Leído</span>
          </div>
        )}
      </div>
    </div>
  );
}
