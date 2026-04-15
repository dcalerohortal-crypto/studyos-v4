import { useState } from "react";

interface CellDiagramProps {
  tipo: "animal" | "vegetal";
  orgánulosActivos?: string[];
  mostrarFunciones?: boolean;
  titulo?: string;
  size?: number;
}

const ORGANELLES = {
  nucleus: {
    name: "Núcleo",
    color: "#6366f1",
    description: "Contiene el ADN y controla las funciones celulares",
  },
  membrane: {
    name: "Membrana celular",
    color: "#22c55e",
    description: "Controla el paso de sustancias",
  },
  cytoplasm: {
    name: "Citoplasma",
    color: "#f59e0b",
    description: "Medio interno donde ocurren las reacciones",
  },
  mitochondria: {
    name: "Mitocondrias",
    color: "#ef4444",
    description: "Producen energía (ATP) mediante respiración celular",
  },
  rER: { name: "RER", color: "#8b5cf6", description: "Síntesis de proteínas" },
  golgi: {
    name: "Aparato de Golgi",
    color: "#ec4899",
    description: "Modifica y empaqueta proteínas",
  },
  ribosomes: {
    name: "Ribosomas",
    color: "#06b6d4",
    description: "Síntesis de proteínas",
  },
  lysosome: {
    name: "Lisosomas",
    color: "#f97316",
    description: "Digestión celular",
  },
  centrioles: {
    name: "Centríolos",
    color: "#84cc16",
    description: "Organización del citoesqueleto, división celular",
  },
  chloroplast: {
    name: "Cloroplastos",
    color: "#22c55e",
    description: "Fotosíntesis (solo célula vegetal)",
  },
  wall: {
    name: "Pared celular",
    color: "#84cc16",
    description: "Soporte y protección (solo célula vegetal)",
  },
  vacuole: {
    name: "Vacuola",
    color: "#3b82f6",
    description: "Almacenamiento (vacuola central grande en vegetal)",
  },
};

export default function CellDiagram({
  tipo,
  orgánulosActivos = ["nucleus", "mitochondria"],
  mostrarFunciones = true,
  titulo,
  size = 300,
}: CellDiagramProps) {
  const [selectedOrganelle, setSelectedOrganelle] = useState<string | null>(
    null
  );
  const [showLabels, setShowLabels] = useState(true);

  const centerX = size / 2;
  const centerY = size / 2;
  const baseRadius = size * 0.4;

  const animalPositions = {
    membrane: { x: centerX, y: centerY, r: baseRadius },
    cytoplasm: { x: centerX, y: centerY, r: baseRadius * 0.95 },
    nucleus: { x: centerX, y: centerY - 10, r: baseRadius * 0.3 },
    mitochondria: [
      {
        x: centerX + baseRadius * 0.6,
        y: centerY - baseRadius * 0.3,
        r: 20,
        rotation: 45,
      },
      {
        x: centerX - baseRadius * 0.5,
        y: centerY + baseRadius * 0.4,
        r: 20,
        rotation: -30,
      },
      {
        x: centerX + baseRadius * 0.2,
        y: centerY + baseRadius * 0.6,
        r: 18,
        rotation: 60,
      },
    ],
    rER: [
      { x: centerX - baseRadius * 0.4, y: centerY - baseRadius * 0.3, r: 15 },
      { x: centerX - baseRadius * 0.5, y: centerY, r: 15 },
    ],
    golgi: {
      x: centerX + baseRadius * 0.3,
      y: centerY + baseRadius * 0.2,
      r: 25,
    },
    ribosomes: [
      { x: centerX - baseRadius * 0.6, y: centerY + baseRadius * 0.1 },
      { x: centerX - baseRadius * 0.4, y: centerY + baseRadius * 0.2 },
    ],
    lysosome: {
      x: centerX + baseRadius * 0.5,
      y: centerY + baseRadius * 0.3,
      r: 12,
    },
    centrioles: [{ x: centerX - 5, y: centerY - baseRadius * 0.4, angle: 0 }],
  };

  const vegetalPositions = {
    membrane: { x: centerX, y: centerY, r: baseRadius },
    wall: { x: centerX, y: centerY, r: baseRadius * 1.05 },
    cytoplasm: { x: centerX, y: centerY, r: baseRadius * 0.95 },
    nucleus: {
      x: centerX - baseRadius * 0.3,
      y: centerY,
      r: baseRadius * 0.25,
    },
    chloroplast: [
      { x: centerX + baseRadius * 0.5, y: centerY - baseRadius * 0.3, r: 22 },
      { x: centerX + baseRadius * 0.4, y: centerY + baseRadius * 0.4, r: 20 },
      { x: centerX - baseRadius * 0.5, y: centerY + baseRadius * 0.3, r: 22 },
    ],
    vacuole: { x: centerX + baseRadius * 0.2, y: centerY, r: baseRadius * 0.5 },
    mitochondria: [
      { x: centerX - baseRadius * 0.2, y: centerY - baseRadius * 0.5, r: 18 },
      { x: centerX + baseRadius * 0.1, y: centerY + baseRadius * 0.6, r: 18 },
    ],
    golgi: {
      x: centerX + baseRadius * 0.3,
      y: centerY - baseRadius * 0.1,
      r: 20,
    },
  };

  const positions = tipo === "animal" ? animalPositions : vegetalPositions;

  const isActive = (organelle: string) => orgánulosActivos.includes(organelle);

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {titulo && (
        <h4 className="font-bold text-foreground mb-2 text-center">{titulo}</h4>
      )}

      <div className="flex justify-center mb-2">
        <span className="bg-muted px-3 py-1 rounded-full text-sm">
          Célula {tipo === "animal" ? "Animal" : "Vegetal"}
        </span>
      </div>

      <div className="flex justify-center mb-3">
        <button
          onClick={() => setShowLabels(!showLabels)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showLabels ? "Ocultar" : "Mostrar"} etiquetas
        </button>
      </div>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
      >
        {(positions as any).membrane && (
          <circle
            cx={(positions as any).membrane.x}
            cy={(positions as any).membrane.y}
            r={(positions as any).membrane.r}
            fill="none"
            stroke={
              isActive("membrane") ? ORGANELLES.membrane.color : "#6B7280"
            }
            strokeWidth={isActive("membrane") ? 4 : 2}
            strokeDasharray={tipo === "vegetal" ? "8,4" : "none"}
            className="transition-all duration-300"
          />
        )}

        {(positions as any).wall && (
          <circle
            cx={(positions as any).wall.x}
            cy={(positions as any).wall.y}
            r={(positions as any).wall.r}
            fill="none"
            stroke={ORGANELLES.wall.color}
            strokeWidth="8"
            opacity={0.3}
          />
        )}

        {(positions as any).cytoplasm && (
          <circle
            cx={(positions as any).cytoplasm.x}
            cy={(positions as any).cytoplasm.y}
            r={(positions as any).cytoplasm.r}
            fill={ORGANELLES.cytoplasm.color}
            fillOpacity={0.1}
          />
        )}

        {(positions as any).nucleus && (
          <g
            onClick={() =>
              setSelectedOrganelle(
                selectedOrganelle === "nucleus" ? null : "nucleus"
              )
            }
            className="cursor-pointer"
          >
            <circle
              cx={(positions as any).nucleus.x}
              cy={(positions as any).nucleus.y}
              r={(positions as any).nucleus.r}
              fill={ORGANELLES.nucleus.color}
              fillOpacity={isActive("nucleus") ? 0.8 : 0.4}
              className="transition-all duration-300"
            />
            <circle
              cx={(positions as any).nucleus.x}
              cy={(positions as any).nucleus.y}
              r={(positions as any).nucleus.r * 0.3}
              fill="#fff"
              fillOpacity={0.5}
            />
            {showLabels && (
              <text
                x={(positions as any).nucleus.x}
                y={
                  (positions as any).nucleus.y +
                  (positions as any).nucleus.r +
                  15
                }
                textAnchor="middle"
                className="text-xs fill-foreground font-semibold"
              >
                Núcleo
              </text>
            )}
          </g>
        )}

        {tipo === "animal" &&
          (positions as any).mitochondria?.map((m: any, idx: number) => (
            <g
              key={idx}
              onClick={() =>
                setSelectedOrganelle(
                  selectedOrganelle === "mitochondria" ? null : "mitochondria"
                )
              }
              className="cursor-pointer"
            >
              <ellipse
                cx={m.x}
                cy={m.y}
                rx={m.r * 1.5}
                ry={m.r}
                fill={ORGANELLES.mitochondria.color}
                fillOpacity={isActive("mitochondria") ? 0.8 : 0.4}
                transform={`rotate(${m.rotation}, ${m.x}, ${m.y})`}
              />
              <ellipse
                cx={m.x}
                cy={m.y}
                rx={m.r * 0.5}
                ry={m.r * 0.3}
                fill="none"
                stroke="#fff"
                strokeOpacity={0.5}
                transform={`rotate(${m.rotation}, ${m.x}, ${m.y})`}
              />
            </g>
          ))}

        {tipo === "vegetal" &&
          (positions as any).chloroplast?.map((c: any, idx: number) => (
            <g
              key={idx}
              onClick={() =>
                setSelectedOrganelle(
                  selectedOrganelle === "chloroplast" ? null : "chloroplast"
                )
              }
              className="cursor-pointer"
            >
              <ellipse
                cx={c.x}
                cy={c.y}
                rx={c.r * 1.5}
                ry={c.r}
                fill={ORGANELLES.chloroplast.color}
                fillOpacity={isActive("chloroplast") ? 0.8 : 0.4}
              />
              <line
                x1={c.x - c.r}
                y1={c.y}
                x2={c.x + c.r}
                y2={c.y}
                stroke="#fff"
                strokeOpacity={0.3}
                strokeWidth="1"
              />
            </g>
          ))}

        {tipo === "vegetal" && (positions as any).vacuole && (
          <g>
            <circle
              cx={(positions as any).vacuole.x}
              cy={(positions as any).vacuole.y}
              r={(positions as any).vacuole.r}
              fill={ORGANELLES.vacuole.color}
              fillOpacity={0.3}
              stroke={ORGANELLES.vacuole.color}
              strokeOpacity={0.5}
              strokeWidth="2"
              strokeDasharray="4,4"
            />
          </g>
        )}
      </svg>

      {mostrarFunciones && selectedOrganelle && (
        <div className="mt-3 p-3 bg-muted rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h5 className="font-semibold text-sm mb-1">
            {(ORGANELLES as any)[selectedOrganelle]?.name}
          </h5>
          <p className="text-xs text-muted-foreground">
            {(ORGANELLES as any)[selectedOrganelle]?.description}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs">
        <span className="px-2 py-1 bg-red-500/20 rounded text-red-400">
          Mitocondrias
        </span>
        <span className="px-2 py-1 bg-purple-500/20 rounded text-purple-400">
          Núcleo
        </span>
        {tipo === "vegetal" && (
          <span className="px-2 py-1 bg-green-500/20 rounded text-green-400">
            Cloroplastos
          </span>
        )}
      </div>
    </div>
  );
}
