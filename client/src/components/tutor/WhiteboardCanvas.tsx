import { useEffect, useRef, useState } from "react";
import katex from "katex";
import type { WhiteboardData } from "@/lib/parseTutorResponse";

interface WhiteboardCanvasProps {
  data: WhiteboardData;
  isCard?: boolean;
  animated?: boolean;
}

export default function WhiteboardCanvas({
  data,
  isCard = false,
  animated = true,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawn, setIsDrawn] = useState(!animated);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!animated) {
      draw();
      return;
    }

    const timer = setTimeout(() => {
      draw();
      setIsDrawn(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [data, animated]);

  const draw = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = container.clientWidth;
    const height = isCard ? 250 : 120;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    if (
      data.whiteboardType === "formula" ||
      data.whiteboardType === "equation"
    ) {
      drawFormula(ctx, width, height, data.formula || data.raw || "");
    } else if (data.whiteboardType === "graph") {
      drawGraph(
        ctx,
        width,
        height,
        data.functionExpr || "x",
        data.rangeX || [-5, 5]
      );
    } else {
      drawCustom(ctx, width, height, data.description || data.raw || "");
    }
  };

  const drawFormula = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    formula: string
  ) => {
    ctx.fillStyle = "#1e1e2e";
    ctx.fillRect(0, 0, width, height);

    try {
      const html = katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
        output: "html",
      });

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      tempDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        font-size: 24px;
      `;
      document.body.appendChild(tempDiv);

      const formulaWidth = tempDiv.offsetWidth;
      const formulaHeight = tempDiv.offsetHeight;

      document.body.removeChild(tempDiv);

      const x = (width - formulaWidth) / 2;
      const y = (height - formulaHeight) / 2;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const formulaElement = doc.body.firstChild as HTMLElement;

      if (formulaElement) {
        const range = document.createRange();
        range.selectNodeContents(formulaElement);
        const fragment = range.extractContents();

        const foreignObject = ctx.canvas.ownerDocument?.createElementNS
          ? ctx.canvas.ownerDocument?.createElementNS(
              "http://www.w3.org/2000/svg",
              "foreignObject"
            )
          : null;

        if (foreignObject) {
          foreignObject.setAttribute("x", String(x));
          foreignObject.setAttribute("y", String(y));
          foreignObject.setAttribute("width", String(formulaWidth + 10));
          foreignObject.setAttribute("height", String(formulaHeight + 10));

          const div = document.createElement("div");
          div.style.cssText = `
            color: #e2e8f0;
            font-size: 24px;
            padding: 10px;
            width: fit-content;
          `;
          div.appendChild(fragment);
          foreignObject.appendChild(div);

          ctx.fillStyle = "#1e1e2e";
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.font = "24px KaTeX_Main, Times New Roman, serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(formula, width / 2, height / 2);

      drawChalkboardTexture(ctx, width, height);
    } catch (err) {
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Error al renderizar fórmula", width / 2, height / 2);
      setError("Error al renderizar fórmula");
    }
  };

  const drawGraph = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    expression: string,
    rangeX: [number, number]
  ) => {
    const [minX, maxX] = rangeX;
    const minY = -10;
    const maxY = 10;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    ctx.fillStyle = "#1e1e2e";
    ctx.fillRect(0, 0, width, height);

    const scaleX = (x: number) =>
      padding + ((x - minX) / (maxX - minX)) * graphWidth;
    const scaleY = (y: number) =>
      height - padding - ((y - minY) / (maxY - minY)) * graphHeight;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let y = minY; y <= maxY; y += 2) {
      ctx.beginPath();
      ctx.moveTo(padding, scaleY(y));
      ctx.lineTo(width - padding, scaleY(y));
      ctx.stroke();
    }
    for (let x = minX; x <= maxX; x += 1) {
      ctx.beginPath();
      ctx.moveTo(scaleX(x), padding);
      ctx.lineTo(scaleX(x), height - padding);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, scaleY(0));
    ctx.lineTo(width - padding, scaleY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(scaleX(0), padding);
    ctx.lineTo(scaleX(0), height - padding);
    ctx.stroke();

    try {
      const evalFn = createFunction(expression);

      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      let firstPoint = true;
      const numPoints = graphWidth;

      for (let i = 0; i <= numPoints; i++) {
        const xVal = minX + (i / numPoints) * (maxX - minX);

        try {
          const yVal = evalFn(xVal);

          if (isFinite(yVal) && yVal >= minY - 5 && yVal <= maxY + 5) {
            const x = scaleX(xVal);
            const y = scaleY(yVal);

            if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            firstPoint = true;
          }
        } catch {
          firstPoint = true;
        }
      }

      ctx.stroke();

      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`f(x) = ${expression}`, 8, 8);

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scaleX(0), scaleY(minY));
      ctx.lineTo(scaleX(0), scaleY(maxY));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scaleX(minX), scaleY(0));
      ctx.lineTo(scaleX(maxX), scaleY(0));
      ctx.stroke();
    } catch (err) {
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.textAlign = "center";
      ctx.fillText(`No se pudo graficar: ${expression}`, width / 2, height / 2);
    }
  };

  const createFunction = (expression: string): ((x: number) => number) => {
    const safeExpression = expression
      .replace(/\^/g, "**")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/exp\(/g, "Math.exp(")
      .replace(/π/g, "Math.PI")
      .replace(/pi/gi, "Math.PI")
      .replace(/e(?![xp])/gi, "Math.E");

    return (x: number) => {
      try {
        const fn = new Function("x", `return ${safeExpression}`);
        return fn(x);
      } catch {
        return NaN;
      }
    };
  };

  const drawCustom = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    text: string
  ) => {
    ctx.fillStyle = "#1e1e2e";
    ctx.fillRect(0, 0, width, height);

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = text.split("\n");
    const lineHeight = 24;
    const startY = (height - (lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + i * lineHeight);
    });
  };

  const drawChalkboardTexture = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let i = 0; i < width; i += 4) {
      for (let j = 0; j < height; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden rounded-lg
        ${isCard ? "w-full" : "w-full"}
        ${!isDrawn ? "opacity-0" : "opacity-100"}
        transition-opacity duration-300
        ${data.whiteboardType === "formula" ? "bg-[#1e1e2e]" : ""}
      `}
    >
      {data.title && (
        <div className="absolute top-2 left-3 text-xs text-slate-400 z-10">
          {data.title}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`
          ${data.whiteboardType === "formula" ? "bg-[#1e1e2e]" : "bg-[#1e1e2e]"}
          ${animated ? "animate-pulse" : ""}
        `}
      />

      {!isDrawn && animated && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e2e]">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-2 right-2 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
