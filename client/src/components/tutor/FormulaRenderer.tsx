import { useMemo } from "react";
import katex from "katex";

interface FormulaRendererProps {
  formula: string;
  className?: string;
  highlightVars?: string[];
  onVarClick?: (variable: string) => void;
}

export default function FormulaRenderer({
  formula,
  className = "",
  highlightVars = [],
  onVarClick,
}: FormulaRendererProps) {
  const html = useMemo(() => {
    try {
      const rendered = katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
        output: "html",
      });

      if (highlightVars.length === 0) return rendered;

      let processed = rendered;
      highlightVars.forEach(v => {
        const regex = new RegExp(
          `(<span class="mord">\\s*<span[^>]*>\\s*${v}\\s*</span>\\s*</span>)`,
          "gi"
        );
        processed = processed.replace(
          regex,
          `<span class="formula-var-highlight" style="background: rgba(139, 92, 246, 0.3); padding: 2px 6px; border-radius: 4px; cursor: pointer;">${v}</span>`
        );
      });

      return processed;
    } catch {
      return `<span class="text-red-500">${formula}</span>`;
    }
  }, [formula, highlightVars]);

  return (
    <div
      className={`formula-container my-4 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={e => {
        if (onVarClick) {
          const target = e.target as HTMLElement;
          if (target.classList.contains("formula-var-highlight")) {
            onVarClick(target.textContent || "");
          }
        }
      }}
    />
  );
}
