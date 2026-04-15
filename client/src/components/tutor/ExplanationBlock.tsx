import { useMemo } from "react";
import {
  parseTutorResponse,
  hasStructuredSteps,
  hasWhiteboardMarkers,
  type ParsedResponse,
} from "@/lib/parseTutorResponse";
import StepCard from "./StepCard";
import MathRenderer from "@/components/notebooks/MathRenderer";
import WhiteboardCanvas from "./WhiteboardCanvas";
import {
  CheckCircle2,
  Lightbulb,
  Sparkles,
  BookOpen,
  LayoutList,
  FileText,
} from "lucide-react";

interface ExplanationBlockProps {
  content: string;
  showStructured?: boolean;
  subject?: string;
  debug?: boolean;
}

export default function ExplanationBlock({
  content,
  showStructured = true,
  subject = "General",
  debug = false,
}: ExplanationBlockProps) {
  const parsed: ParsedResponse = useMemo(() => {
    return parseTutorResponse(content);
  }, [content]);

  const hasSteps = parsed.steps.length > 0;
  const hasWhiteboards =
    parsed.hasWhiteboards || parsed.steps.some(s => s.whiteboards.length > 0);
  // Show structured format when we have steps (even 1 step is structured)
  const isStructured = hasSteps;

  // Debug output
  if (debug) {
    console.log("[ExplanationBlock] Parsed:", {
      stepsCount: parsed.steps.length,
      hasWhiteboards,
      isStructured,
      plainTextLength: parsed.plainText.length,
      steps: parsed.steps.map(s => ({
        number: s.number,
        title: s.title,
        contentLength: s.content.length,
        contentPreview:
          s.content.slice(0, 80) + (s.content.length > 80 ? "..." : ""),
        whiteboards: s.whiteboards.length,
      })),
    });
  }

  const getSubjectIcon = () => {
    switch (subject.toLowerCase()) {
      case "física":
      case "fisica":
        return "⚡";
      case "matemáticas":
      case "matematicas":
        return "📐";
      case "química":
      case "quimica":
        return "🧪";
      case "inglés":
      case "ingles":
        return "🌍";
      case "historia":
        return "📜";
      case "biología":
      case "biologia":
        return "🧬";
      default:
        return "📚";
    }
  };

  // Si no hay pasos estructurados Y no hay whiteboards, mostrar texto plano
  if (!showStructured || (!isStructured && !hasWhiteboards)) {
    if (debug) {
      console.log("[ExplanationBlock] Using plain text fallback");
    }
    return (
      <div className="prose prose-sm max-w-none">
        {content
          .split("\n\n")
          .filter(Boolean)
          .map((paragraph, idx) => (
            <div key={idx} className="mb-4">
              <MathRenderer content={paragraph} />
            </div>
          ))}
      </div>
    );
  }

  // Si hay whiteboards pero no pasos, crear un paso único
  if (!hasSteps) {
    return (
      <div className="space-y-4">
        {/* Solo whiteboards */}
        {hasWhiteboards && (
          <div className="grid grid-cols-1 gap-4">
            {parsed.steps[0]?.whiteboards.map((wb, idx) => (
              <div
                key={idx}
                className="bg-card rounded-xl overflow-hidden border border-border"
              >
                <WhiteboardCanvas
                  data={wb.data}
                  isCard={wb.type === "card"}
                  animated={true}
                />
              </div>
            ))}
          </div>
        )}
        {/* Texto simple */}
        <div className="prose prose-sm max-w-none">
          <MathRenderer content={parsed.plainText} />
        </div>
      </div>
    );
  }

  // Renderizar pasos estructurados
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getSubjectIcon()}</span>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Explicación paso a paso
            </h3>
            <p className="text-xs text-muted-foreground">
              {parsed.steps.length} paso{parsed.steps.length !== 1 ? "s" : ""} ·
              {hasWhiteboards && " Con visualizaciones"}
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {parsed.steps.map((step, index) => (
          <StepCard
            key={step.number}
            step={step}
            isFirst={index === 0}
            defaultExpanded={index === 0}
          />
        ))}
      </div>

      {/* Summary */}
      {parsed.summary && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-purple-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Resumen
              </h4>
              <div className="mt-2 text-sm text-foreground/80">
                <MathRenderer content={parsed.summary} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Indicators */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/30">
        {hasWhiteboards && (
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>Con visualizaciones</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <LayoutList className="w-4 h-4" />
          <span>
            {parsed.steps.length} paso{parsed.steps.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

// Componente simple para renderizar solo whiteboards
export function WhiteboardGallery({ content }: { content: string }) {
  const parsed = useMemo(() => parseTutorResponse(content), [content]);

  const allWhiteboards = parsed.steps.flatMap(s => s.whiteboards);

  if (allWhiteboards.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      {allWhiteboards.map((wb, idx) => (
        <div
          key={idx}
          className="bg-card rounded-xl overflow-hidden border border-border shadow-sm"
        >
          <WhiteboardCanvas data={wb.data} isCard animated={true} />
        </div>
      ))}
    </div>
  );
}
