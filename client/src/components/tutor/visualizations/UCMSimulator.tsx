import { useState, useEffect, useRef, useCallback } from "react";

interface UCMSimulatorProps {
  radio?: number;
  velocidadAngular?: number;
  periodo?: number;
  anguloActual?: number;
  mostrarVectores?: boolean;
  mostrarAngulo?: boolean;
  autoPlay?: boolean;
  onAnguloChange?: (angulo: number) => void;
}

export default function UCMSimulator({
  radio: initialRadio = 100,
  velocidadAngular: initialOmega,
  periodo: initialPeriodo,
  anguloActual: externalAngulo,
  mostrarVectores = true,
  mostrarAngulo = true,
  autoPlay = false,
  onAnguloChange,
}: UCMSimulatorProps) {
  const [radio, setRadio] = useState(initialRadio);
  const [omega, setOmega] = useState(
    initialOmega || (initialPeriodo ? (2 * Math.PI) / initialPeriodo : 2)
  );
  const [periodo, setPeriodo] = useState(
    initialPeriodo || (initialOmega ? (2 * Math.PI) / initialOmega : Math.PI)
  );
  const [angulo, setAngulo] = useState(externalAngulo || 0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (externalAngulo !== undefined) {
      setAngulo(externalAngulo);
    }
  }, [externalAngulo]);

  const calcularOmegaFromPeriodo = (T: number) => (2 * Math.PI) / T;
  const calcularPeriodoFromOmega = (w: number) => (2 * Math.PI) / w;

  useEffect(() => {
    if (!isPlaying) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setAngulo(prev => {
        const newAngulo = prev + omega * delta;
        if (onAnguloChange) onAnguloChange(newAngulo);
        return newAngulo % (2 * Math.PI);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, omega, onAnguloChange]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const reset = () => {
    setAngulo(0);
    setIsPlaying(false);
    lastTimeRef.current = 0;
  };

  const normalizeAngle = (a: number) =>
    ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const anguloGrados = (normalizeAngle(angulo) * 180) / Math.PI;

  const centerX = 150;
  const centerY = 120;
  const scale = 0.8;
  const r = radio * scale;

  const particleX = centerX + r * Math.cos(angulo - Math.PI / 2);
  const particleY = centerY + r * Math.sin(angulo - Math.PI / 2);

  const velocidadTangencial = omega * radio;

  const vtX = -Math.sin(angulo - Math.PI / 2) * velocidadTangencial * 0.3;
  const vtY = Math.cos(angulo - Math.PI / 2) * velocidadTangencial * 0.3;

  return (
    <div className="w-full bg-card/50 rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-foreground">
          UCM: Movimiento Circular Uniforme
        </h3>
        <div className="flex gap-2">
          <button
            onClick={togglePlay}
            className="px-3 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg text-sm font-medium transition-colors"
          >
            {isPlaying ? "⏸ Pausar" : "▶ Reproducir"}
          </button>
          <button
            onClick={reset}
            className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary/70 rounded-lg text-sm transition-colors"
          >
            ↺ Reiniciar
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">
            Radio (m)
          </label>
          <input
            type="range"
            min="30"
            max="150"
            step="5"
            value={radio}
            onChange={e => setRadio(parseFloat(e.target.value))}
            className="w-full accent-accent"
            disabled={isPlaying}
          />
          <span className="text-sm text-accent font-mono">{radio} m</span>
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">
            Período T (s)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={periodo}
            onChange={e => {
              const newPeriodo = parseFloat(e.target.value);
              setPeriodo(newPeriodo);
              setOmega(calcularOmegaFromPeriodo(newPeriodo));
            }}
            className="w-full accent-accent"
            disabled={isPlaying}
          />
          <span className="text-sm text-accent font-mono">
            {periodo.toFixed(1)} s
          </span>
        </div>
        <div className="text-center px-4 py-2 bg-secondary/30 rounded-lg">
          <div className="text-xs text-muted-foreground">Ángulo θ</div>
          <div className="text-xl font-mono font-bold text-accent">
            {anguloGrados.toFixed(0)}°
          </div>
        </div>
      </div>

      <div className="bg-secondary/20 rounded-lg p-4 flex justify-center">
        <svg viewBox="0 0 300 240" className="w-full max-w-md">
          <circle
            cx={centerX}
            cy={centerY}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          <line
            x1={centerX}
            y1={centerY}
            x2={particleX}
            y2={particleY}
            stroke="#8b5cf6"
            strokeWidth="2"
          />

          {mostrarAngulo && (
            <path
              d={`M ${centerX + 40 * Math.cos(-Math.PI / 2)} ${centerY + 40 * Math.sin(-Math.PI / 2)} A 40 40 0 0 1 ${particleX} ${particleY}`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
            />
          )}

          <circle cx={centerX} cy={centerY} r="5" fill="#8b5cf6" />

          <circle cx={particleX} cy={particleY} r="8" fill="#10b981">
            <animate
              attributeName="r"
              values="8;10;8"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>

          {mostrarVectores && (
            <>
              <line
                x1={particleX}
                y1={particleY}
                x2={particleX + vtX}
                y2={particleY + vtY}
                stroke="#10b981"
                strokeWidth="3"
                markerEnd="url(#arrow-green)"
              />
              <text
                x={particleX + vtX / 2 + 10}
                y={particleY + vtY / 2 - 10}
                className="text-[10px] fill-emerald-500 font-mono"
              >
                v
              </text>
            </>
          )}

          <defs>
            <marker
              id="arrow-green"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
            </marker>
          </defs>

          <text
            x={centerX + 10}
            y={centerY - r - 10}
            className="text-xs fill-muted-foreground"
          >
            r = {radio}m
          </text>

          {mostrarAngulo && (
            <text
              x={centerX + 50}
              y={centerY - 10}
              className="text-xs fill-amber-500 font-mono"
            >
              θ = {anguloGrados.toFixed(0)}°
            </text>
          )}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-secondary/30 rounded-lg">
          <div className="text-xs text-muted-foreground">ω (vel. angular)</div>
          <div className="text-lg font-mono font-bold text-accent">
            {omega.toFixed(2)} rad/s
          </div>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <div className="text-xs text-muted-foreground">v (tangencial)</div>
          <div className="text-lg font-mono font-bold text-emerald-500">
            {velocidadTangencial.toFixed(1)} m/s
          </div>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <div className="text-xs text-muted-foreground">Período T</div>
          <div className="text-lg font-mono font-bold text-violet-500">
            {periodo.toFixed(1)} s
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 bg-accent/10 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">
          Fórmulas del MCU:
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm font-mono">
          <div>θ = ω·t</div>
          <div>v = ω·r</div>
          <div>T = 2π/ω</div>
          <div>T = 2πr/v</div>
        </div>
      </div>
    </div>
  );
}
