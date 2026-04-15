// Parser para respuestas estructuradas del tutor IA
// Parsea ## Paso X:, [PIZARRA-INLINE], [PIZARRA-CARD]

export interface WhiteboardInline {
  type: "inline";
  data: WhiteboardData;
}

export interface WhiteboardCard {
  type: "card";
  data: WhiteboardData;
}

export type WhiteboardMarker = WhiteboardInline | WhiteboardCard;

export interface WhiteboardData {
  whiteboardType?: "formula" | "graph" | "diagram" | "equation" | "custom";
  formula?: string;
  functionExpr?: string;
  rangeX?: [number, number];
  rangeY?: [number, number];
  title?: string;
  description?: string;
  raw?: string;
}

export interface ParsedStep {
  number: number;
  title: string;
  content: string;
  whiteboards: WhiteboardMarker[];
}

export interface ParsedResponse {
  steps: ParsedStep[];
  summary?: string;
  plainText: string;
  hasWhiteboards: boolean;
}

const PIZARRA_INLINE_START = "[PIZARRA-INLINE]";
const PIZARRA_INLINE_END = "[/PIZARRA]";
const PIZARRA_CARD_START = "[PIZARRA-CARD]";
const PIZARRA_CARD_END = "[/PIZARRA]";

// Función mejorada para parsear el contenido dentro de un PIZARRA
function parseWhiteboardContent(rawContent: string): WhiteboardData {
  const content = rawContent.trim();

  const data: WhiteboardData = {
    raw: content,
    whiteboardType: "formula",
  };

  // Detectar si es una fórmula (contiene LaTeX)
  const hasLatex = content.match(
    /\\frac|\\sqrt|\\sum|\\int|\\lim|\\sin|\\cos|\\tan|\\log|\\ln|\\exp|\^{2}|\_{/
  );

  // Detectar si es un gráfico
  const isGraph =
    content.match(/^y\s*=|f\(x\)\s*=|graph|gráfica|plot/i) ||
    (content.match(/expr|función/i) && content.match(/=/));

  // Detectar rango
  const rangeMatch = content.match(/range[:\s]*[-]?\d+[,.\s]+[-]?\d+/i);
  if (rangeMatch) {
    const nums = rangeMatch[0].match(/-?\d+\.?\d*/g);
    if (nums && nums.length >= 2) {
      data.rangeX = [parseFloat(nums[0]), parseFloat(nums[1])];
    }
  }

  // Parsear fórmula
  if (hasLatex || (!isGraph && content.includes("$"))) {
    data.whiteboardType = "formula";
    // Extraer solo la fórmula (quitar prefijos como "formula:")
    const formulaMatch =
      content.match(/formula:\s*(.+)/i) ||
      content.match(/\$\$?([^$]+)\$\$?/) ||
      content.match(/\\.+/);
    if (formulaMatch) {
      data.formula = formulaMatch[1].trim() || content;
    } else {
      data.formula = content;
    }
  }
  // Parsear gráfico
  else if (isGraph || content.match(/graph|plot/i)) {
    data.whiteboardType = "graph";
    const exprMatch =
      content.match(/y\s*=\s*(.+)/i) ||
      content.match(/f\(x\)\s*=\s*(.+)/i) ||
      content.match(/expr[:\s]*(.+)/i) ||
      content.match(/función[:\s]*(.+)/i);
    if (exprMatch) {
      data.functionExpr = exprMatch[1].trim();
    }
  }
  // Por defecto, tratar como fórmula
  else {
    data.whiteboardType = "formula";
    data.formula = content;
  }

  return data;
}

// Extrae todos los whiteboards y limpia el texto
function extractAllWhiteboards(text: string): {
  cleanText: string;
  whiteboards: WhiteboardMarker[];
  inlineWhiteboards: WhiteboardMarker[];
  cardWhiteboards: WhiteboardMarker[];
} {
  const whiteboards: WhiteboardMarker[] = [];
  const inlineWhiteboards: WhiteboardMarker[] = [];
  const cardWhiteboards: WhiteboardMarker[] = [];

  let cleanText = text;

  // PIZARRA-INLINE
  const inlineRegex = /\[PIZARRA-INLINE\]\s*([\s\S]*?)\s*\[\/PIZARRA\]/gi;
  let match;
  while ((match = inlineRegex.exec(text)) !== null) {
    const wbData = parseWhiteboardContent(match[1]);
    const wb = { type: "inline" as const, data: wbData };
    whiteboards.push(wb);
    inlineWhiteboards.push(wb);
  }

  // PIZARRA-CARD
  const cardRegex = /\[PIZARRA-CARD\]\s*([\s\S]*?)\s*\[\/PIZARRA\]/gi;
  while ((match = cardRegex.exec(text)) !== null) {
    const wbData = parseWhiteboardContent(match[1]);
    const wb = { type: "card" as const, data: wbData };
    whiteboards.push(wb);
    cardWhiteboards.push(wb);
  }

  // Limpiar el texto de las marcas PIZARRA
  cleanText = cleanText.replace(inlineRegex, "").replace(cardRegex, "").trim();

  return { cleanText, whiteboards, inlineWhiteboards, cardWhiteboards };
}

// Parsea el header de un paso
// Acepta: ## Paso 1:, Paso 1: Título, Paso 1 - Título, 1. Título, ### Paso 1 - Título
function parseStepHeader(
  line: string
): { number: number; title: string } | null {
  const trimmed = line.trim();

  // Patrones más flexibles - ordenados por especificidad
  const patterns = [
    // ## Paso 1: Título o ## Paso 1 - Título (con ##)
    { regex: /^##\s*Paso\s*(\d+)[:\-\s]+(.+)$/i, numIdx: 1, titleIdx: 2 },
    // ## Paso 1 (sin título, con ##)
    { regex: /^##\s*Paso\s*(\d+)$/i, numIdx: 1, titleIdx: null },
    // ### Paso 1: Título (con ###)
    { regex: /^###\s*Paso\s*(\d+)[:\-\s]+(.+)$/i, numIdx: 1, titleIdx: 2 },
    // ## 1. Título (con ##)
    { regex: /^##\s*(\d+)[:\.\-\s]+(.+)$/, numIdx: 1, titleIdx: 2 },
    // Paso 1: Título o Paso 1 - Título (sin ##)
    { regex: /^Paso\s*(\d+)[:\-\s]+(.+)$/i, numIdx: 1, titleIdx: 2 },
    // Paso 1 (sin título, sin ##)
    { regex: /^Paso\s*(\d+)$/i, numIdx: 1, titleIdx: null },
    // Step 1: Título (inglés)
    { regex: /^Step\s*(\d+)[:\-\s]+(.+)$/i, numIdx: 1, titleIdx: 2 },
    // 1. Título (numérico solo)
    { regex: /^(\d+)[:\.\-\s]+(.+)$/, numIdx: 1, titleIdx: 2 },
  ];

  for (const { regex, numIdx, titleIdx } of patterns) {
    const match = trimmed.match(regex);
    if (match) {
      return {
        number: parseInt(match[numIdx], 10),
        title:
          titleIdx && match[titleIdx]
            ? match[titleIdx].trim()
            : `Paso ${match[numIdx]}`,
      };
    }
  }

  return null;
}

// Secciones a filtrar del contenido
const FILTERED_SECTIONS = [
  /^##?\s*Ejercicios/i,
  /^##?\s*Problemas/i,
  /^##?\s*Práctica/i,
  /^##?\s*Practice/i,
  /^##?\s*Ejemplos\s*adicionales/i,
  /^##?\s*Más\s*información/i,
  /^##?\s*Nota[s]?\s*(?:importante|adicional)/i,
  /^##?\s*Errores\s*(?:frecuentes|comunes)/i,
  /^##?\s*Tips?\s*(?:para|con)/i,
  /^##?\s*Trucos?\s*(?:para|con)/i,
];

function isFilteredSection(line: string): boolean {
  return FILTERED_SECTIONS.some(regex => regex.test(line.trim()));
}

export function parseTutorResponse(responseText: string): ParsedResponse {
  // Primero, extraer todos los whiteboards del texto
  const { cleanText, whiteboards, inlineWhiteboards, cardWhiteboards } =
    extractAllWhiteboards(responseText);

  // Si no hay nada después de limpiar, devolver vacío
  if (!cleanText.trim()) {
    return {
      steps: [],
      summary: undefined,
      plainText: "",
      hasWhiteboards: whiteboards.length > 0,
    };
  }

  // Dividir por líneas
  const lines = cleanText.split("\n");
  const steps: ParsedStep[] = [];
  let currentStep: ParsedStep | null = null;
  let currentInlineWhiteboards: WhiteboardMarker[] = [];
  let summaryLines: string[] = [];
  let inSummary = false;
  let inFilteredSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Detectar inicio de resumen
    if (
      trimmedLine.match(
        /^##?\s*Resumen|^##?\s*Summary|^##?\s*Conclusión|^##?\s*Key\s*Takeaways/i
      )
    ) {
      // Guardar el paso actual
      if (currentStep) {
        currentStep.whiteboards = [...currentInlineWhiteboards];
        steps.push(currentStep);
        currentStep = null;
      }
      inSummary = true;
      inFilteredSection = false;
      continue;
    }

    // Detectar secciones filtradas
    if (isFilteredSection(trimmedLine)) {
      inFilteredSection = true;
      continue;
    }

    // Si estamos en modo resumen
    if (inSummary) {
      if (trimmedLine) {
        summaryLines.push(trimmedLine);
      }
      continue;
    }

    // Si estamos en una sección filtrada, skip
    if (inFilteredSection) {
      // Verificar si hay un nuevo paso
      const stepInfo = parseStepHeader(trimmedLine);
      if (stepInfo) {
        inFilteredSection = false;
      } else {
        continue;
      }
    }

    // Detectar si esta línea es un header de paso
    const stepInfo = parseStepHeader(trimmedLine);

    if (stepInfo) {
      // Guardar paso anterior
      if (currentStep) {
        currentStep.whiteboards = [...currentInlineWhiteboards];
        steps.push(currentStep);
      }

      // Crear nuevo paso
      currentStep = {
        number: stepInfo.number,
        title: stepInfo.title,
        content: "",
        whiteboards: [],
      };
      currentInlineWhiteboards = [];
      inFilteredSection = false;
      continue;
    }

    // Si hay un paso actual, acumular contenido
    if (currentStep) {
      if (trimmedLine) {
        // Si la línea empieza con guiones o números, podría ser contenido de lista
        // o simplemente añadir la línea al contenido
        currentStep.content += trimmedLine + "\n";
      }
    }
  }

  // Guardar el último paso
  if (currentStep) {
    currentStep.whiteboards = [...currentInlineWhiteboards];
    steps.push(currentStep);
  }

  // Si no se encontraron pasos estructurados, crear un paso único
  if (steps.length === 0) {
    steps.push({
      number: 1,
      title: "Explicación",
      content: cleanText,
      whiteboards: [...inlineWhiteboards],
    });
  }

  // Limpiar el contenido de cada paso
  steps.forEach(step => {
    // Eliminar líneas vacías excesivas
    step.content = step.content
      .split("\n")
      .map(l => l.trim())
      .filter(l => l)
      .join("\n\n");
  });

  const summary =
    summaryLines.length > 0 ? summaryLines.join("\n\n") : undefined;

  return {
    steps,
    summary,
    plainText: cleanText,
    hasWhiteboards: whiteboards.length > 0,
  };
}

export function hasStructuredSteps(text: string): boolean {
  return (
    text.match(/##\s*Paso\s*\d+|Paso\s*\d+[:\-]|Step\s*\d+[:\-]/i) !== null
  );
}

export function hasWhiteboardMarkers(text: string): boolean {
  return (
    text.includes(PIZARRA_INLINE_START) || text.includes(PIZARRA_CARD_START)
  );
}

// Debug helper
export function debugParse(text: string): object {
  const parsed = parseTutorResponse(text);
  return {
    rawLength: text.length,
    stepsCount: parsed.steps.length,
    hasWhiteboards: parsed.hasWhiteboards,
    steps: parsed.steps.map(s => ({
      number: s.number,
      title: s.title,
      contentLength: s.content.length,
      whiteboardsCount: s.whiteboards.length,
      contentPreview: s.content.slice(0, 100),
    })),
    summary: parsed.summary?.slice(0, 100),
  };
}
