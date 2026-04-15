import { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
}

export default function MathRenderer({
  content,
  className = "",
}: MathRendererProps) {
  const renderedContent = useMemo(() => {
    return renderMathContent(content);
  }, [content]);

  return (
    <div
      className={`math-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

function preprocessMathContent(text: string): string {
  let result = text;

  const mathBlockRegex = /\$\$[\s\S]*?\$\$/g;
  const mathInlineRegex = /\$[^\$\n]+?\$/g;

  const blocks: { placeholder: string; content: string; isBlock: boolean }[] =
    [];
  let blockIndex = 0;

  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
    const placeholder = `__MATH_BLOCK_${blockIndex}__`;
    blocks.push({ placeholder, content: match, isBlock: true });
    blockIndex++;
    return placeholder;
  });

  result = result.replace(/\$([^\$\n]+?)\$/g, (match, content) => {
    const placeholder = `__MATH_INLINE_${blockIndex}__`;
    blocks.push({ placeholder, content: match, isBlock: false });
    blockIndex++;
    return placeholder;
  });

  result = result.replace(/\\frac\s*\{/g, "\\frac{");
  result = result.replace(/\\frac\s*\n\s*\{/g, "\\frac{");

  result = result.replace(/\{([^}]*)\n([^}]*)\}/g, (match, p1, p2) => {
    if (p1.includes("\\")) return match;
    return `{${p1}${p2}}`;
  });

  result = result.replace(/([^\\])'/g, "$1\\text{'}");
  result = result.replace(/^'/g, "\\text{'}");

  result = result.replace(/\\text\{'\}/g, "'");

  for (let i = 0; i < blocks.length; i++) {
    let mathContent = blocks[i].content;

    mathContent = mathContent.replace(/([^\\])'/g, "$1\\text{'}");
    mathContent = mathContent.replace(/^'/g, "\\text{'}");
    mathContent = mathContent.replace(/\\frac\s*\{/g, "\\frac{");
    mathContent = mathContent.replace(/\{([^}]*)\n([^}]*)\}/g, (m, p1, p2) => {
      return `{${p1}${p2}}`;
    });

    blocks[i].content = mathContent;
    result = result.replace(blocks[i].placeholder, blocks[i].content);
  }

  return result;
}

function escapeHtmlSmart(text: string): string {
  const parts: string[] = [];
  let current = "";
  let inMath = false;
  let i = 0;

  while (i < text.length) {
    if (text[i] === "$" && (i === 0 || text[i - 1] !== "\\")) {
      if (inMath) {
        current += "$";
        parts.push(current);
        current = "";
        inMath = false;
      } else {
        if (current) {
          parts.push(escapeHtmlText(current));
          current = "";
        }
        current = "$";
        inMath = true;
      }
      i++;
    } else {
      current += text[i];
      i++;
    }
  }

  if (current) {
    parts.push(inMath ? current : escapeHtmlText(current));
  }

  return parts.join("");
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMathContent(text: string): string {
  if (!text) return "";

  let result = text;

  result = preprocessMathContent(result);

  result = escapeHtmlSmart(result);

  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return renderBlockMath(math);
  });

  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    return renderInlineMath(math);
  });

  return result;
}

function renderInlineMath(math: string): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode: false,
      throwOnError: false,
      errorColor: "#ff6b6b",
    });
  } catch {
    return `<span class="math-error">${math}</span>`;
  }
}

function renderBlockMath(math: string): string {
  try {
    return `<div class="math-block">${katex.renderToString(math.trim(), {
      displayMode: true,
      throwOnError: false,
      errorColor: "#ff6b6b",
    })}</div>`;
  } catch {
    return `<div class="math-error">${math}</div>`;
  }
}

export function isMathContent(text: string): boolean {
  return /\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$/.test(text);
}
