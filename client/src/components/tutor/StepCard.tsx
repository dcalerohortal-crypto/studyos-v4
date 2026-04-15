import { useState } from "react";
import { ChevronDown, ChevronRight, Lightbulb, BookOpen } from "lucide-react";
import WhiteboardCanvas from "./WhiteboardCanvas";
import type { ParsedStep, WhiteboardMarker } from "@/lib/parseTutorResponse";
import MathRenderer from "@/components/notebooks/MathRenderer";

// Extract first meaningful sentence from content
function getStepPreview(content: string): string {
  if (!content) return "";

  // Split by sentence-ending punctuation
  const sentences = content.split(/[.\n]/).filter(s => s.trim().length > 10);

  if (sentences.length === 0) {
    return content.slice(0, 80) + (content.length > 80 ? "..." : "");
  }

  // Return first sentence, cleaned
  const first = sentences[0].trim();
  return first.length > 100 ? first.slice(0, 100) + "..." : first + ".";
}

interface StepCardProps {
  step: ParsedStep;
  isFirst?: boolean;
  defaultExpanded?: boolean;
}

export default function StepCard({
  step,
  isFirst = false,
  defaultExpanded = false,
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isFirst);
  const [showHint, setShowHint] = useState(false);

  const inlineWhiteboards = step.whiteboards.filter(w => w.type === "inline");
  const cardWhiteboards = step.whiteboards.filter(w => w.type === "card");

  const renderWhiteboard = (wb: WhiteboardMarker, index: number) => (
    <div key={`wb-${index}`} className={wb.type === "inline" ? "my-3" : "mt-4"}>
      <WhiteboardCanvas
        data={wb.data}
        isCard={wb.type === "card"}
        animated={true}
      />
    </div>
  );

  return (
    <div
      className={`
        group relative rounded-xl overflow-hidden
        border transition-all duration-300
        ${
          isExpanded
            ? "border-purple-500/50 bg-card/80 shadow-lg shadow-purple-500/10"
            : "border-border/50 bg-card/50 hover:border-purple-500/30 hover:bg-card/70"
        }
      `}
    >
      {/* Step Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors"
      >
        {/* Step Number Badge */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            font-bold text-sm transition-all duration-300
            ${
              isExpanded
                ? "bg-purple-500 text-white scale-110"
                : "bg-secondary text-muted-foreground group-hover:bg-purple-500/20"
            }
          `}
        >
          {step.number}
        </div>

        {/* Step Title */}
        <div className="flex-1 min-w-0">
          <h3
            className={`
              font-semibold truncate transition-colors
              ${isExpanded ? "text-foreground" : "text-muted-foreground"}
            `}
          >
            {step.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {inlineWhiteboards.length > 0 &&
              `${inlineWhiteboards.length} visualización${inlineWhiteboards.length > 1 ? "es" : ""}`}
            {inlineWhiteboards.length > 0 &&
              cardWhiteboards.length > 0 &&
              " · "}
            {cardWhiteboards.length > 0 &&
              `${cardWhiteboards.length} diagrama${cardWhiteboards.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Expand Icon */}
        <div
          className={`
            flex-shrink-0 transition-transform duration-300
            ${isExpanded ? "rotate-180 text-purple-400" : "text-muted-foreground"}
          `}
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Expanded Content */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Content with Math */}
          <div className="prose prose-sm max-w-none">
            {step.content
              .split("\n\n")
              .filter(Boolean)
              .map((paragraph, idx) => (
                <div
                  key={idx}
                  className="text-sm text-foreground/90 leading-relaxed"
                >
                  <MathRenderer content={paragraph} />
                </div>
              ))}
          </div>

          {/* Inline Whiteboards */}
          {inlineWhiteboards.length > 0 && (
            <div className="space-y-3">
              {inlineWhiteboards.map((wb, idx) => renderWhiteboard(wb, idx))}
            </div>
          )}

          {/* Hint Button */}
          {step.content.length > 100 && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-purple-400 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? "Ocultar pista" : "Ver pista rápida"}
            </button>
          )}

          {showHint && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {getStepPreview(step.content)}
                </p>
              </div>
            </div>
          )}

          {/* Card Whiteboards */}
          {cardWhiteboards.length > 0 && (
            <div className="space-y-4 border-t border-border/50 pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>Visualizaciones</span>
              </div>
              {cardWhiteboards.map((wb, idx) => renderWhiteboard(wb, idx))}
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: isExpanded ? "100%" : "0%" }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {isExpanded ? "Completado" : "Pendiente"}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsed Preview (shown when not expanded) */}
      {!isExpanded && step.content && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-1">
            {getStepPreview(step.content)}
          </p>
        </div>
      )}

      {/* Corner Accent */}
      <div
        className={`
          absolute top-0 right-0 w-16 h-16 
          bg-gradient-to-bl from-purple-500/20 to-transparent
          transition-opacity duration-300
          ${isExpanded ? "opacity-100" : "opacity-0"}
        `}
      />
    </div>
  );
}
