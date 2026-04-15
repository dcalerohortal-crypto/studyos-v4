import { useMemo } from "react";

interface TrigCircleProps {
  angulo: number;
  mostrarSeno?: boolean;
  mostrarCoseno?: boolean;
  mostrarTangente?: boolean;
  titulo?: string;
  size?: number;
}

export default function TrigCircle({
  angulo,
  mostrarSeno = true,
  mostrarCoseno = true,
  mostrarTangente = true,
  titulo,
  size = 300,
}: TrigCircleProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;

  const radians = (angulo * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const tan = sin / cos;

  const pointOnCircleX = centerX + radius * cos;
  const pointOnCircleY = centerY - radius * sin;

  const sinHeight = centerY - radius * sin;
  const cosWidth = centerX + radius * cos;

  const tanEndX = centerX + radius * 1.5;
  const tanEndY = centerY - radius * 1.5 * tan;

  const quadrant = getQuadrant(angulo);

  const quadrantNames: Record<string, string> = {
    QI: "I",
    QII: "II",
    QIII: "III",
    QIV: "IV",
  };

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {titulo && (
        <h4 className="font-bold text-foreground mb-2 text-center">{titulo}</h4>
      )}

      <div className="flex justify-center mb-3">
        <div className="bg-muted px-4 py-2 rounded-lg">
          <span className="font-mono text-lg">
            θ = {angulo}° ({quadrantNames[quadrant]})
          </span>
        </div>
      </div>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto overflow-visible"
      >
        <defs>
          <marker
            id="arrowBlack"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
          </marker>
          <marker
            id="arrowRed"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
          </marker>
          <marker
            id="arrowGreen"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
          </marker>
          <marker
            id="arrowBlue"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
        </defs>

        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth="1"
        />

        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        <line
          x1={centerX}
          y1={centerY}
          x2={pointOnCircleX}
          y2={pointOnCircleY}
          stroke="#6366f1"
          strokeWidth="3"
          markerEnd="url(#arrowBlack)"
        />

        <line
          x1={centerX}
          y1={centerY}
          x2={size}
          y2={centerY}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        {mostrarCoseno && (
          <>
            <line
              x1={pointOnCircleX}
              y1={centerY}
              x2={pointOnCircleX}
              y2={centerY}
              stroke="#ef4444"
              strokeWidth="3"
              markerEnd="url(#arrowRed)"
            />
            <line
              x1={pointOnCircleX}
              y1={centerY}
              x2={pointOnCircleX}
              y2={pointOnCircleY}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity={0.6}
            />
          </>
        )}

        {mostrarSeno && (
          <>
            <line
              x1={centerX}
              y1={sinHeight}
              x2={centerX}
              y2={pointOnCircleY}
              stroke="#22c55e"
              strokeWidth="3"
              markerEnd="url(#arrowGreen)"
            />
            <line
              x1={pointOnCircleX}
              y1={centerY}
              x2={pointOnCircleX}
              y2={pointOnCircleY}
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity={0.6}
            />
          </>
        )}

        {mostrarTangente && cos !== 0 && (
          <>
            <line
              x1={pointOnCircleX}
              y1={pointOnCircleY}
              x2={tanEndX}
              y2={tanEndY}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </>
        )}

        <circle cx={pointOnCircleX} cy={pointOnCircleY} r="6" fill="#6366f1" />

        <text
          x={centerX + radius + 15}
          y={centerY + 5}
          className="text-sm fill-muted-foreground"
        >
          (1, 0)
        </text>
        <text
          x={centerX - radius - 15}
          y={centerY + 5}
          className="text-sm fill-muted-foreground"
          textAnchor="end"
        >
          (-1, 0)
        </text>
        <text
          x={centerX + 5}
          y={centerY - radius - 10}
          className="text-sm fill-muted-foreground"
        >
          (0, 1)
        </text>
        <text
          x={centerX + 5}
          y={centerY + radius + 20}
          className="text-sm fill-muted-foreground"
        >
          (0, -1)
        </text>

        <text
          x={centerX + radius * 1.3 * cos}
          y={centerY - radius * 1.3 * sin - 10}
          textAnchor="middle"
          className="text-sm fill-foreground font-bold"
        >
          P
        </text>
      </svg>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
        <div className="bg-red-500/20 rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-1">cos(θ)</div>
          <div className="font-mono font-bold text-red-400">
            {cos.toFixed(3)}
          </div>
        </div>
        <div className="bg-green-500/20 rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-1">sin(θ)</div>
          <div className="font-mono font-bold text-green-400">
            {sin.toFixed(3)}
          </div>
        </div>
        {mostrarTangente && cos !== 0 && (
          <div className="bg-blue-500/20 rounded-lg p-2">
            <div className="text-xs text-muted-foreground mb-1">tan(θ)</div>
            <div className="font-mono font-bold text-blue-400">
              {tan.toFixed(3)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getQuadrant(angle: number): string {
  const normalized = ((angle % 360) + 360) % 360;

  if (normalized >= 0 && normalized < 90) return "QI";
  if (normalized >= 90 && normalized < 180) return "QII";
  if (normalized >= 180 && normalized < 270) return "QIII";
  return "QIV";
}
