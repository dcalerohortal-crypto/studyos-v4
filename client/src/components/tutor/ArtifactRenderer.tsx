import { useState, useEffect, useRef } from "react";
import FormulaRenderer from "./FormulaRenderer";
import PhysicsSimulator from "./visualizations/PhysicsSimulator";
import FunctionGraph from "./visualizations/FunctionGraph";
import TrigCircle from "./visualizations/TrigCircle";
import MoleculeDiagram from "./visualizations/MoleculeDiagram";
import CellDiagram from "./visualizations/CellDiagram";
import type { PhysicsSimulationType } from "@/types";

type ArtifactType =
  | "simulation"
  | "formula"
  | "chart"
  | "diagram"
  | "animation"
  | "function_graph"
  | "trig_circle"
  | "molecule"
  | "cell_diagram"
  | "dna_diagram"
  | "wave_diagram"
  | "periodic_element"
  | "reaction_scheme"
  | "geometry_shape";

interface ArtifactRendererProps {
  type: ArtifactType;
  data: any;
  onError?: (error: string) => void;
}

interface SimulationData {
  type: PhysicsSimulationType;
  params: any;
  titulo?: string;
}

interface FormulaData {
  formula: string;
  nombre?: string;
  descripcion?: string;
}

interface ChartData {
  type: "line" | "bar";
  titulo: string;
  datos: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color?: string;
    }>;
  };
  xLabel?: string;
  yLabel?: string;
}

interface DiagramData {
  tipo: "force" | "motion" | "energy" | "timeline" | "flowchart" | "custom";
  elementos?: Array<{
    tipo: string;
    texto?: string;
    x?: number;
    y?: number;
    color?: string;
    tamano?: number;
  }>;
  titulo: string;
  svgContent?: string;
}

interface FunctionGraphData {
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
}

interface TrigCircleData {
  angulo: number;
  mostrarSeno?: boolean;
  mostrarCoseno?: boolean;
  mostrarTangente?: boolean;
  titulo?: string;
}

interface MoleculeData {
  formula: string;
  nombre?: string;
  tipo?: "lewis" | "ball-stick" | "espacial";
  titulo?: string;
}

interface CellDiagramData {
  tipo: "animal" | "vegetal";
  orgánulosActivos?: string[];
  mostrarFunciones?: boolean;
  titulo?: string;
}

interface WaveData {
  amplitud?: number;
  longitudOnda?: number;
  frecuencia?: number;
  tipo?: "transversal" | "longitudinal";
  titulo?: string;
}

export default function ArtifactRenderer({
  type,
  data,
  onError,
}: ArtifactRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setError(null);
  }, [type, data]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
        <p className="text-sm text-destructive">Error al renderizar: {error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Reintentar
        </button>
      </div>
    );
  }

  try {
    switch (type) {
      case "simulation":
        return <SimulationRenderer data={data as SimulationData} />;

      case "formula":
        return <FormulaDataRenderer data={data as FormulaData} />;

      case "chart":
        return <ChartRenderer data={data as ChartData} />;

      case "diagram":
        return <DiagramRenderer data={data as DiagramData} />;

      case "animation":
        return <AnimationRenderer data={data} />;

      case "function_graph":
        return <FunctionGraphRenderer data={data as FunctionGraphData} />;

      case "trig_circle":
        return <TrigCircleRenderer data={data as TrigCircleData} />;

      case "molecule":
        return <MoleculeRenderer data={data as MoleculeData} />;

      case "cell_diagram":
        return <CellDiagramRenderer data={data as CellDiagramData} />;

      case "wave_diagram":
        return <WaveRenderer data={data as WaveData} />;

      case "geometry_shape":
        return <GeometryShapeRenderer data={data} />;

      default:
        return (
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground">
              Tipo de visualización no reconocido: {type}
            </p>
          </div>
        );
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    setError(errorMsg);
    onError?.(errorMsg);

    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
        <p className="text-sm text-destructive">
          Error al renderizar: {errorMsg}
        </p>
      </div>
    );
  }
}

function SimulationRenderer({ data }: { data: SimulationData }) {
  if (!data?.type) {
    return (
      <div className="p-4 bg-muted rounded-xl">
        <p className="text-sm text-muted-foreground">
          Datos de simulación incompletos
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {data.titulo && (
        <h4 className="font-bold text-foreground mb-2">{data.titulo}</h4>
      )}
      <PhysicsSimulator tipo={data.type} parametros={data.params || {}} />
    </div>
  );
}

function FormulaDataRenderer({ data }: { data: FormulaData }) {
  if (!data?.formula) {
    return null;
  }

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {data.nombre && (
        <h4 className="font-bold text-foreground mb-2">{data.nombre}</h4>
      )}
      <div className="flex justify-center py-4">
        <FormulaRenderer formula={data.formula} />
      </div>
      {data.descripcion && (
        <p className="text-sm text-muted-foreground mt-2">{data.descripcion}</p>
      )}
    </div>
  );
}

function ChartRenderer({ data }: { data: ChartData }) {
  if (!data?.datos?.labels || !data?.datos?.datasets) {
    return (
      <div className="p-4 bg-muted rounded-xl">
        <p className="text-sm text-muted-foreground">
          Datos del gráfico incompletos
        </p>
      </div>
    );
  }

  const { labels, datasets } = data.datos;
  const maxValue = Math.max(...datasets.flatMap(d => d.data), 1);
  const chartHeight = 200;
  const chartWidth = containerRef.current?.clientWidth || 400;
  const barWidth = (chartWidth - 40) / labels.length - 8;

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {data.titulo && (
        <h4 className="font-bold text-foreground mb-4 text-center">
          {data.titulo}
        </h4>
      )}

      <div
        ref={containerRef}
        className="relative"
        style={{ height: chartHeight }}
      >
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1="30"
                y1={chartHeight - 20 - ratio * (chartHeight - 40)}
                x2={chartWidth - 10}
                y2={chartHeight - 20 - ratio * (chartHeight - 40)}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth="1"
              />
              <text
                x="25"
                y={chartHeight - 16 - ratio * (chartHeight - 40)}
                textAnchor="end"
                className="text-xs fill-muted-foreground"
              >
                {(maxValue * ratio).toFixed(0)}
              </text>
            </g>
          ))}

          {labels.map((label, i) => {
            const x = 40 + i * (barWidth + 8) + barWidth / 2;
            const datasetOffset = 0;

            return (
              <g key={i}>
                {datasets.map((dataset, j) => {
                  const value = dataset.data[i] || 0;
                  const barHeight = (value / maxValue) * (chartHeight - 40);
                  const barX =
                    x - (datasets.length * barWidth) / 2 + j * barWidth;

                  return (
                    <g key={j}>
                      <rect
                        x={barX}
                        y={chartHeight - 20 - barHeight}
                        width={Math.max(barWidth - 2, 4)}
                        height={barHeight}
                        fill={
                          dataset.color || (j === 0 ? "#6366f1" : "#8b5cf6")
                        }
                        rx="4"
                        className="transition-all duration-300"
                      />
                      {data.type === "line" && value > 0 && (
                        <circle
                          cx={barX + (barWidth - 2) / 2}
                          cy={chartHeight - 20 - barHeight}
                          r="4"
                          fill={dataset.color || "#6366f1"}
                        />
                      )}
                    </g>
                  );
                })}
                <text
                  x={x}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {data.type === "line" && (
            <path
              d={datasets
                .map((dataset, j) => {
                  const points = dataset.data
                    .map((value, i) => {
                      const x =
                        40 +
                        i * (barWidth + 8) +
                        barWidth / 2 -
                        (datasets.length * barWidth) / 2 +
                        j * barWidth +
                        barWidth / 2;
                      const y =
                        chartHeight -
                        20 -
                        (value / maxValue) * (chartHeight - 40);
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ");

                  return points;
                })
                .join(" ")}
              fill="none"
              stroke={datasets[0]?.color || "#6366f1"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        <div className="flex justify-center gap-4 mt-2">
          {datasets.map((dataset, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    dataset.color || (i === 0 ? "#6366f1" : "#8b5cf6"),
                }}
              />
              <span className="text-xs text-muted-foreground">
                {dataset.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{data.xLabel || ""}</span>
        <span>{data.yLabel || ""}</span>
      </div>
    </div>
  );
}

function DiagramRenderer({ data }: { data: DiagramData }) {
  const width = 400;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;

  const renderDiagram = () => {
    switch (data.tipo) {
      case "force":
        return (
          <g>
            <circle
              cx={centerX}
              cy={centerY}
              r={40}
              fill="#6366f1"
              opacity={0.3}
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={40}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
            />

            <line
              x1={centerX}
              y1={centerY}
              x2={centerX + 80}
              y2={centerY}
              stroke="#ef4444"
              strokeWidth="3"
              markerEnd="url(#arrowRed)"
            />
            <text
              x={centerX + 90}
              y={centerY + 5}
              className="text-xs fill-red-500 font-bold"
            >
              F (hacia adelante)
            </text>

            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY + 80}
              stroke="#22c55e"
              strokeWidth="3"
              markerEnd="url(#arrowGreen)"
            />
            <text
              x={centerX + 10}
              y={centerY + 100}
              className="text-xs fill-green-500 font-bold"
            >
              N (Normal)
            </text>

            <line
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - 80}
              stroke="#3b82f6"
              strokeWidth="3"
              markerEnd="url(#arrowBlue)"
            />
            <text
              x={centerX + 10}
              y={centerY - 90}
              className="text-xs fill-blue-500 font-bold"
            >
              F_g (Gravedad)
            </text>

            <defs>
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
          </g>
        );

      case "motion":
        return (
          <g>
            <line
              x1={50}
              y1={centerY}
              x2={350}
              y2={centerY}
              stroke="currentColor"
              strokeWidth="2"
              markerEnd="url(#arrowBlack)"
            />
            <text
              x={355}
              y={centerY + 5}
              className="text-sm fill-muted-foreground"
            >
              x
            </text>

            <circle cx={150} cy={centerY} r={15} fill="#6366f1" opacity={0.8}>
              <animate
                attributeName="cx"
                values="150;300;150"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>

            <text
              x={centerX}
              y={40}
              textAnchor="middle"
              className="text-sm fill-foreground font-bold"
            >
              MRU: posición constante
            </text>

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
            </defs>
          </g>
        );

      case "energy":
        return (
          <g>
            <rect
              x={50}
              y={100}
              width={100}
              height={100}
              fill="#f59e0b"
              rx="8"
              opacity={0.8}
            />
            <text
              x={100}
              y={155}
              textAnchor="middle"
              className="text-sm fill-white font-bold"
            >
              E_p
            </text>

            <line
              x1={160}
              y1={150}
              x2={240}
              y2={150}
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="20"
                dur="1s"
                repeatCount="indefinite"
              />
            </line>

            <rect
              x={250}
              y={100}
              width={100}
              height={100}
              fill="#22c55e"
              rx="8"
              opacity={0.8}
            />
            <text
              x={300}
              y={155}
              textAnchor="middle"
              className="text-sm fill-white font-bold"
            >
              E_c
            </text>

            <text
              x={centerX}
              y={40}
              textAnchor="middle"
              className="text-sm fill-foreground font-bold"
            >
              Conservación de energía
            </text>

            <text
              x={centerX}
              y={250}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              E_p + E_c = constante
            </text>
          </g>
        );

      default:
        if (data.svgContent) {
          return <g dangerouslySetInnerHTML={{ __html: data.svgContent }} />;
        }
        return (
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            className="fill-muted-foreground"
          >
            Diagrama no disponible
          </text>
        );
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {data.titulo && (
        <h4 className="font-bold text-foreground mb-2 text-center">
          {data.titulo}
        </h4>
      )}

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="text-foreground"
      >
        {renderDiagram()}
      </svg>
    </div>
  );
}

function AnimationRenderer({ data }: { data: any }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!data?.frames) return;

    const interval = setInterval(() => {
      setFrame(f => (f + 1) % data.frames.length);
    }, data.interval || 500);

    return () => clearInterval(interval);
  }, [data]);

  if (!data?.frames || !data.frames[frame]) {
    return null;
  }

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {data.titulo && (
        <h4 className="font-bold text-foreground mb-2 text-center">
          {data.titulo}
        </h4>
      )}

      <div className="flex justify-center py-4">
        {typeof data.frames[frame] === "string" ? (
          <FormulaRenderer formula={data.frames[frame]} />
        ) : (
          <span className="text-foreground">{data.frames[frame]}</span>
        )}
      </div>

      <div className="flex justify-center gap-1 mt-2">
        {data.frames.map((_: any, i: number) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === frame ? "bg-accent" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function FunctionGraphRenderer({ data }: { data: FunctionGraphData }) {
  return (
    <FunctionGraph
      tipo={data.tipo || "lineal"}
      funcion={data.funcion}
      rangoMinX={data.rangoMinX}
      rangoMaxX={data.rangoMaxX}
      titulo={data.titulo}
    />
  );
}

function TrigCircleRenderer({ data }: { data: TrigCircleData }) {
  return (
    <TrigCircle
      angulo={data.angulo || 45}
      mostrarSeno={data.mostrarSeno !== false}
      mostrarCoseno={data.mostrarCoseno !== false}
      mostrarTangente={data.mostrarTangente}
      titulo={data.titulo}
    />
  );
}

function MoleculeRenderer({ data }: { data: MoleculeData }) {
  return (
    <MoleculeDiagram
      formula={data.formula || "H2O"}
      nombre={data.nombre}
      tipo={data.tipo || "ball-stick"}
      titulo={data.titulo}
    />
  );
}

function CellDiagramRenderer({ data }: { data: CellDiagramData }) {
  return (
    <CellDiagram
      tipo={data.tipo || "animal"}
      orgánulosActivos={data.orgánulosActivos}
      mostrarFunciones={data.mostrarFunciones !== false}
      titulo={data.titulo}
    />
  );
}

function WaveRenderer({ data }: { data: WaveData }) {
  const width = 400;
  const height = 200;
  const amplitude = data.amplitud || 50;
  const wavelength = data.longitudOnda || 100;
  const frequency = data.frecuencia || 1;
  const isTransverse = data.tipo !== "longitudinal";

  const pathPoints: string[] = [];
  const numPoints = 200;

  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * width;
    const y =
      height / 2 +
      amplitude * Math.sin((2 * Math.PI * i * frequency) / numPoints);

    if (i === 0) {
      pathPoints.push(`M ${x} ${y}`);
    } else {
      pathPoints.push(`L ${x} ${y}`);
    }
  }

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {data.titulo && (
        <h4 className="font-bold text-foreground mb-2 text-center">
          {data.titulo}
        </h4>
      )}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto overflow-visible"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        <path
          d={pathPoints.join(" ")}
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <line
          x1={wavelength}
          y1={height - 20}
          x2={wavelength}
          y2={height - 5}
          stroke="#6366f1"
          strokeWidth="2"
        />
        <line
          x1={0}
          y1={height - 12}
          x2={wavelength}
          y2={height - 12}
          stroke="#6366f1"
          strokeWidth="2"
        />
        <text
          x={wavelength / 2}
          y={height - 25}
          textAnchor="middle"
          className="text-xs fill-muted-foreground"
        >
          λ
        </text>

        <line
          x1={-20}
          y1={height / 2 - amplitude}
          x2={-5}
          y2={height / 2 - amplitude}
          stroke="#22c55e"
          strokeWidth="2"
        />
        <line
          x1={-20}
          y1={height / 2 + amplitude}
          x2={-5}
          y2={height / 2 + amplitude}
          stroke="#22c55e"
          strokeWidth="2"
        />
        <line
          x1={-20}
          y1={height / 2 - amplitude}
          x2={-20}
          y2={height / 2 + amplitude}
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text
          x={-30}
          y={height / 2 + 5}
          textAnchor="middle"
          className="text-xs fill-muted-foreground"
          transform={`rotate(-90, -30, ${height / 2 + 5})`}
        >
          2A
        </text>
      </svg>

      <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>λ = {wavelength} px</span>
        <span>A = {amplitude} px</span>
        <span>f = {frequency} Hz</span>
      </div>
    </div>
  );
}

function GeometryShapeRenderer({ data }: { data: any }) {
  const width = 300;
  const height = 250;
  const centerX = width / 2;
  const centerY = height / 2;

  const renderShape = () => {
    const lado1 = data.dimensiones?.lado1 || 100;
    const lado2 = data.dimensiones?.lado2 || 80;
    const radio = data.dimensiones?.radio || 50;
    const numLados = data.dimensiones?.numLados || 6;

    switch (data.tipo) {
      case "triangulo":
        return (
          <polygon
            points={`${centerX},${centerY - lado1 * 0.5} ${centerX - lado1 * 0.5},${centerY + lado1 * 0.4} ${centerX + lado1 * 0.5},${centerY + lado1 * 0.4}`}
            fill="#6366f1"
            fillOpacity={0.3}
            stroke="#6366f1"
            strokeWidth="2"
          />
        );

      case "cuadrado":
        return (
          <rect
            x={centerX - lado1 / 2}
            y={centerY - lado1 / 2}
            width={lado1}
            height={lado1}
            fill="#6366f1"
            fillOpacity={0.3}
            stroke="#6366f1"
            strokeWidth="2"
          />
        );

      case "rectangulo":
        return (
          <rect
            x={centerX - lado1 / 2}
            y={centerY - lado2 / 2}
            width={lado1}
            height={lado2}
            fill="#6366f1"
            fillOpacity={0.3}
            stroke="#6366f1"
            strokeWidth="2"
          />
        );

      case "circulo":
        return (
          <>
            <circle
              cx={centerX}
              cy={centerY}
              r={radio}
              fill="#6366f1"
              fillOpacity={0.3}
              stroke="#6366f1"
              strokeWidth="2"
            />
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX + radio}
              y2={centerY}
              stroke="#6366f1"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text
              x={centerX + radio / 2}
              y={centerY - 10}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              r
            </text>
          </>
        );

      case "poligono":
        const points: string[] = [];
        for (let i = 0; i < numLados; i++) {
          const angle = (i * 2 * Math.PI) / numLados - Math.PI / 2;
          const x = centerX + radio * Math.cos(angle);
          const y = centerY + radio * Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return (
          <polygon
            points={points.join(" ")}
            fill="#6366f1"
            fillOpacity={0.3}
            stroke="#6366f1"
            strokeWidth="2"
          />
        );

      default:
        return (
          <rect
            x={centerX - 50}
            y={centerY - 50}
            width={100}
            height={100}
            fill="#6366f1"
            fillOpacity={0.3}
            stroke="#6366f1"
            strokeWidth="2"
          />
        );
    }
  };

  const calculateArea = () => {
    switch (data.tipo) {
      case "triangulo":
        return (lado1 * lado2) / 2;
      case "cuadrado":
        return lado1 * lado1;
      case "rectangulo":
        return lado1 * lado2;
      case "circulo":
        return Math.PI * radio * radio;
      case "poligono":
        return (
          (numLados * radio * radio * Math.sin((2 * Math.PI) / numLados)) / 2
        );
      default:
        return lado1 * lado1;
    }
  };

  const calculatePerimeter = () => {
    switch (data.tipo) {
      case "triangulo":
        return lado1 + lado2 * 2;
      case "cuadrado":
        return lado1 * 4;
      case "rectangulo":
        return (lado1 + lado2) * 2;
      case "circulo":
        return 2 * Math.PI * radio;
      case "poligono":
        return numLados * 2 * radio * Math.sin(Math.PI / numLados);
      default:
        return lado1 * 4;
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {data.titulo && (
        <h4 className="font-bold text-foreground mb-2 text-center">
          {data.titulo}
        </h4>
      )}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto"
      >
        {renderShape()}
      </svg>

      <div className="flex justify-center gap-4 mt-3 text-sm">
        {data.mostrarArea !== false && (
          <div className="bg-muted px-3 py-1 rounded">
            <span className="text-muted-foreground">Área: </span>
            <span className="font-mono font-bold">
              {calculateArea().toFixed(1)}
            </span>
          </div>
        )}
        {data.mostrarPerimetro !== false && (
          <div className="bg-muted px-3 py-1 rounded">
            <span className="text-muted-foreground">Perímetro: </span>
            <span className="font-mono font-bold">
              {calculatePerimeter().toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
