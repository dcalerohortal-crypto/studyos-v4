import { useMemo } from "react";

interface MoleculeDiagramProps {
  formula: string;
  nombre?: string;
  tipo?: "lewis" | "ball-stick" | "espacial";
  titulo?: string;
  size?: number;
}

interface MoleculeAtom {
  element: string;
  x: number;
  y: number;
}

interface MoleculeBond {
  from: number;
  to: number;
  order: number;
}

interface MoleculeData {
  atoms: MoleculeAtom[];
  bonds: MoleculeBond[];
}

const ELEMENT_COLORS: Record<string, { fill: string; stroke: string }> = {
  H: { fill: "#FFFFFF", stroke: "#6B7280" },
  C: { fill: "#374151", stroke: "#1F2937" },
  N: { fill: "#3B82F6", stroke: "#1D4ED8" },
  O: { fill: "#EF4444", stroke: "#B91C1C" },
  S: { fill: "#EAB308", stroke: "#A16207" },
  P: { fill: "#F97316", stroke: "#C2410C" },
  Cl: { fill: "#22C55E", stroke: "#15803D" },
  Br: { fill: "#B91C1C", stroke: "#7F1D1D" },
  F: { fill: "#06B6D4", stroke: "#0E7490" },
  I: { fill: "#8B5CF6", stroke: "#6D28D9" },
  Na: { fill: "#EC4899", stroke: "#BE185D" },
  K: { fill: "#EC4899", stroke: "#BE185D" },
  Ca: { fill: "#84CC16", stroke: "#4D7C0F" },
  Mg: { fill: "#84CC16", stroke: "#4D7C0F" },
};

const ATOM_SIZES: Record<string, number> = {
  H: 20,
  C: 35,
  N: 33,
  O: 30,
  S: 40,
  P: 38,
  Cl: 35,
  Br: 38,
  F: 28,
  I: 45,
  Na: 40,
  K: 45,
  Ca: 45,
  Mg: 40,
};

const COMMON_MOLECULES: Record<string, MoleculeData> = {
  H2O: {
    atoms: [
      { element: "O", x: 0, y: 0 },
      { element: "H", x: -50, y: 40 },
      { element: "H", x: 50, y: 40 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
  },
  CO2: {
    atoms: [
      { element: "O", x: -60, y: 0 },
      { element: "C", x: 0, y: 0 },
      { element: "O", x: 60, y: 0 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 2 },
    ],
  },
  CH4: {
    atoms: [
      { element: "C", x: 0, y: 0 },
      { element: "H", x: -45, y: -45 },
      { element: "H", x: 45, y: -45 },
      { element: "H", x: -45, y: 45 },
      { element: "H", x: 45, y: 45 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  },
  NH3: {
    atoms: [
      { element: "N", x: 0, y: -20 },
      { element: "H", x: -40, y: 30 },
      { element: "H", x: 40, y: 30 },
      { element: "H", x: 0, y: 50 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
  },
  O2: {
    atoms: [
      { element: "O", x: -30, y: 0 },
      { element: "O", x: 30, y: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 2 }],
  },
  N2: {
    atoms: [
      { element: "N", x: -30, y: 0 },
      { element: "N", x: 30, y: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 3 }],
  },
  HCl: {
    atoms: [
      { element: "H", x: -30, y: 0 },
      { element: "Cl", x: 30, y: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }],
  },
  NaCl: {
    atoms: [
      { element: "Na", x: -40, y: 0 },
      { element: "Cl", x: 40, y: 0 },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }],
  },
};

export default function MoleculeDiagram({
  formula,
  nombre,
  tipo = "ball-stick",
  titulo,
  size = 250,
}: MoleculeDiagramProps) {
  const molecule = useMemo(() => {
    const cleanFormula = formula.replace(/[₀-₉]/g, c =>
      String.fromCharCode(c.charCodeAt(0) - 0xfe10)
    );

    if (COMMON_MOLECULES[cleanFormula]) {
      return COMMON_MOLECULES[cleanFormula];
    }

    const atoms: { element: string; x: number; y: number }[] = [];
    const bonds: { from: number; to: number; order: number }[] = [];

    let i = 0;
    let y = 0;
    while (i < cleanFormula.length) {
      const match = cleanFormula.slice(i).match(/^([A-Z][a-z]?)(\d*)/);
      if (match) {
        const element = match[1];
        const count = match[2] ? parseInt(match[2]) : 1;

        for (let j = 0; j < count; j++) {
          atoms.push({
            element,
            x: ((atoms.length % 4) - 1.5) * 50,
            y: Math.floor(atoms.length / 4) * 60 - 30,
          });
        }

        if (atoms.length > 1) {
          bonds.push({
            from: atoms.length - count - 1,
            to: atoms.length - 1,
            order: 1,
          });
        }

        i += match[0].length;
      } else {
        i++;
      }
    }

    return { atoms, bonds };
  }, [formula]);

  const centerX = size / 2;
  const centerY = size / 2;

  const offsetX = centerX;
  const offsetY = centerY;

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4 animate-in fade-in duration-300">
      {titulo && (
        <h4 className="font-bold text-foreground mb-1 text-center">{titulo}</h4>
      )}
      {nombre && (
        <p className="text-sm text-muted-foreground text-center mb-2">
          {nombre}
        </p>
      )}

      <div className="flex justify-center mb-2">
        <code className="bg-muted px-3 py-1 rounded text-sm font-mono">
          {formula}
        </code>
      </div>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {molecule.bonds.map((bond, idx) => {
          const fromAtom = molecule.atoms[bond.from];
          const toAtom = molecule.atoms[bond.to];

          const x1 = offsetX + fromAtom.x;
          const y1 = offsetY + fromAtom.y;
          const x2 = offsetX + toAtom.x;
          const y2 = offsetY + toAtom.y;

          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const perpX = (-dy / len) * 4;
          const perpY = (dx / len) * 4;

          const lines = [];

          if (bond.order === 1) {
            lines.push(
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6B7280"
                strokeWidth="4"
              />
            );
          } else if (bond.order === 2) {
            lines.push(
              <line
                key={idx}
                x1={x1 + perpX}
                y1={y1 + perpY}
                x2={x2 + perpX}
                y2={y2 + perpY}
                stroke="#6B7280"
                strokeWidth="3"
              />,
              <line
                key={idx + 100}
                x1={x1 - perpX}
                y1={y1 - perpY}
                x2={x2 - perpX}
                y2={y2 - perpY}
                stroke="#6B7280"
                strokeWidth="3"
              />
            );
          } else if (bond.order === 3) {
            lines.push(
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6B7280"
                strokeWidth="3"
              />,
              <line
                key={idx + 100}
                x1={x1 + perpX * 2}
                y1={y1 + perpY * 2}
                x2={x2 + perpX * 2}
                y2={y2 + perpY * 2}
                stroke="#6B7280"
                strokeWidth="3"
              />,
              <line
                key={idx + 200}
                x1={x1 - perpX * 2}
                y1={y1 - perpY * 2}
                x2={x2 - perpX * 2}
                y2={y2 - perpY * 2}
                stroke="#6B7280"
                strokeWidth="3"
              />
            );
          }

          return lines;
        })}

        {molecule.atoms.map((atom, idx) => {
          const colors = ELEMENT_COLORS[atom.element] || {
            fill: "#9CA3AF",
            stroke: "#6B7280",
          };
          const atomSize = ATOM_SIZES[atom.element] || 30;

          return (
            <g key={idx}>
              {tipo === "ball-stick" && (
                <circle
                  cx={offsetX + atom.x}
                  cy={offsetY + atom.y}
                  r={atomSize}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="2"
                  filter="url(#glow)"
                />
              )}
              {tipo === "espacial" && (
                <circle
                  cx={offsetX + atom.x}
                  cy={offsetY + atom.y}
                  r={atomSize * 0.8}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="2"
                  opacity={0.9}
                />
              )}
              {tipo === "lewis" && (
                <>
                  <circle
                    cx={offsetX + atom.x}
                    cy={offsetY + atom.y}
                    r={atomSize * 0.6}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="2"
                  />
                </>
              )}
              <text
                x={offsetX + atom.x}
                y={offsetY + atom.y + 5}
                textAnchor="middle"
                className="text-xs fill-foreground font-bold pointer-events-none select-none"
                style={{ fontSize: atomSize * 0.5 }}
              >
                {atom.element}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs">
        {Object.entries(
          molecule.atoms.reduce(
            (acc, atom) => {
              acc[atom.element] = (acc[atom.element] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        ).map(([element, count]) => (
          <span key={element} className="bg-muted px-2 py-1 rounded">
            {element}: {count}
          </span>
        ))}
      </div>
    </div>
  );
}
