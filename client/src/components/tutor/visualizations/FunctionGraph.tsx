import { useMemo, useState } from "react";

interface FunctionGraphProps {
  tipo:
    | "lineal"
    | "cuadratica"
    | "cubica"
    | "trigonometrica"
    | "exponencial"
    | "logaritmica"
    | "racional";
  funcion?: string;
  rangoMinX?: number;
  rangoMaxX?: number;
  titulo?: string;
  width?: number;
  height?: number;
}

export default function FunctionGraph({
  tipo,
  funcion,
  rangoMinX = -10,
  rangoMaxX = 10,
  titulo,
  width = 500,
  height = 300,
}: FunctionGraphProps) {
  const [animating, setAnimating] = useState(false);

  const { path, points } = useMemo(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scaleX = width / (rangoMaxX - rangoMinX);
    const scaleY = height / (rangoMaxX - rangoMinX);

    const toCanvasX = (x: number) => centerX + x * scaleX;
    const toCanvasY = (y: number) => centerY - y * scaleY;

    const evaluate = (x: number): number | null => {
      try {
        switch (tipo) {
          case "lineal":
            return x;
          case "cuadratica":
            return x * x;
          case "cubica":
            return x * x * x;
          case "trigonometrica":
            return Math.sin(x);
          case "exponencial":
            return Math.exp(x / 3);
          case "logaritmica":
            return x > 0 ? Math.log(x) : null;
          case "racional":
            return x !== 0 ? 1 / x : null;
          default:
            return x;
        }
      } catch {
        return null;
      }
    };

    const pts: { x: number; y: number }[] = [];
    const numPoints = 200;
    const step = (rangoMaxX - rangoMinX) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const x = rangoMinX + i * step;
      const y = evaluate(x);

      if (y !== null && y > -20 && y < 20) {
        pts.push({
          x: toCanvasX(x),
          y: toCanvasY(y),
        });
      } else if (pts.length > 0 && pts[pts.length - 1].valid) {
        pts.push({ x: toCanvasX(x), y: toCanvasY(y), valid: false as any });
      }
    }

    const pathParts: string[] = [];
    let inPath = false;

    pts.forEach((pt, idx) => {
      const isValid = "valid" in pt ? (pt as any).valid !== false : true;

      if (isValid) {
        if (!inPath) {
          pathParts.push(`M ${pt.x} ${pt.y}`);
          inPath = true;
        } else {
          pathParts.push(`L ${pt.x} ${pt.y}`);
        }
      } else {
        inPath = false;
      }
    });

    return {
      path: pathParts.join(" "),
      points: pts.filter(p => !("valid" in p) || !(p as any).valid),
    };
  }, [tipo, rangoMinX, rangoMaxX, width, height]);

  const labels = useMemo(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scaleX = width / (rangoMaxX - rangoMinX);
    const scaleY = height / (rangoMaxX - rangoMinX);

    const labels = [];

    for (let i = rangoMinX; i <= rangoMaxX; i += 2) {
      if (i !== 0) {
        labels.push({
          x: centerX + i * scaleX,
          y: centerY + 15,
          text: i.toString(),
        });
      }
    }

    for (let i = rangoMinX; i <= rangoMaxX; i += 2) {
      if (i !== 0) {
        labels.push({
          x: centerX - 15,
          y: centerY - i * scaleY + 4,
          text: i.toString(),
        });
      }
    }

    return labels;
  }, [rangoMinX, rangoMaxX, width, height]);

  const functionNames: Record<string, string> = {
    lineal: "f(x) = x",
    cuadratica: "f(x) = x²",
    cubica: "f(x) = x³",
    trigonometrica: "f(x) = sin(x)",
    exponencial: "f(x) = e^(x/3)",
    logaritmica: "f(x) = ln(x)",
    racional: "f(x) = 1/x",
  };

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {titulo && (
        <h4 className="font-bold text-foreground mb-2 text-center">{titulo}</h4>
      )}

      <div className="flex justify-center mb-2">
        <code className="bg-muted px-3 py-1 rounded text-sm font-mono">
          {funcion || functionNames[tipo] || "f(x)"}
        </code>
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto overflow-visible"
      >
        <defs>
          <linearGradient
            id="functionGradient"
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="transparent" />

        <line
          x1={width / 2}
          y1={0}
          x2={width / 2}
          y2={height}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth="1"
        />
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth="1"
        />

        {labels.map((label, idx) => (
          <text
            key={idx}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {label.text}
          </text>
        ))}

        <text
          x={width - 10}
          y={height / 2 - 10}
          textAnchor="end"
          className="text-sm fill-muted-foreground"
        >
          x
        </text>
        <text
          x={width / 2 + 10}
          y={15}
          className="text-sm fill-muted-foreground"
        >
          y
        </text>

        <path
          d={path}
          fill="none"
          stroke="url(#functionGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-500"
          style={{
            filter: animating
              ? "drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))"
              : "none",
          }}
        />

        <circle
          cx={width / 2}
          cy={height / 2}
          r="4"
          fill="#6366f1"
          opacity={0.5}
        />
      </svg>

      <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>Punto negro: origen (0,0)</span>
      </div>
    </div>
  );
}
