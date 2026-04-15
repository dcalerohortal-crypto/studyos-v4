import { useState, useEffect, useRef, useCallback } from "react";

interface CentripetalSimulatorProps {
  radio?: number;
  masa?: number;
  velocidadLineal?: number;
  mostrarVectores?: boolean;
  mostrarFuerza?: boolean;
  mostrarRadio?: boolean;
  autoPlay?: boolean;
  onAnguloChange?: (angulo: number) => void;
}

export default function CentripetalSimulator({
  radio: initialRadio = 80,
  masa: initialMasa = 2,
  velocidadLineal: initialVelocidad = 10,
  mostrarVectores = true,
  mostrarFuerza = true,
  mostrarRadio = true,
  autoPlay = false,
  onAnguloChange,
}: CentripetalSimulatorProps) {
  const [radio, setRadio] = useState(initialRadio);
  const [masa, setMasa] = useState(initialMasa);
  const [velocidad, setVelocidad] = useState(initialVelocidad);
  const [angulo, setAngulo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const fuerzaCentripeta = (masa * velocidad * velocidad) / radio;
  const omega = velocidad / radio;

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

  const centerX = 150;
  const centerY = 120;
  const scale = 1.2;
  const r = radio * scale;

  const particleX = centerX + r * Math.cos(angulo - Math.PI / 2);
  const particleY = centerY + r * Math.sin(angulo - Math.PI / 2);

  const fcX = -Math.cos(angulo - Math.PI / 2) * fuerzaCentripeta * 0.15;
  const fcY = -Math.sin(angulo - Math.PI / 2) * fuerzaCentripeta * 0.15;

  return (
    <div className="w-full bg-card/50 rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-foreground">Fuerza Centrípeta</h3>
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

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Radio (m)
          </label>
          <input
            type="range"
            min="30"
            max="120"
            step="5"
            value={radio}
            onChange={e => setRadio(parseFloat(e.target.value))}
            className="w-full accent-accent"
            disabled={isPlaying}
          />
          <span className="text-sm text-accent font-mono">{radio} m</span>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Masa (kg)
          </label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={masa}
            onChange={e => setMasa(parseFloat(e.target.value))}
            className="w-full accent-accent"
            disabled={isPlaying}
          />
          <span className="text-sm text-accent font-mono">
            {masa.toFixed(1)} kg
          </span>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Velocidad (m/s)
          </label>
          <input
            type="range"
            min="2"
            max="20"
            step="1"
            value={velocidad}
            onChange={e => setVelocidad(parseFloat(e.target.value))}
            className="w-full accent-accent"
            disabled={isPlaying}
          />
          <span className="text-sm text-accent font-mono">
            {velocidad.toFixed(1)} m/s
          </span>
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

          {mostrarRadio && (
            <>
              <line
                x1={centerX}
                y1={centerY}
                x2={particleX}
                y2={particleY}
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeDasharray="2 2"
              />
              <text
                x={(centerX + particleX) / 2 + 10}
                y={(centerY + particleY) / 2}
                className="text-[10px] fill-violet-400"
              >
                r
              </text>
            </>
          )}

          <circle cx={centerX} cy={centerY} r="4" fill="#6b7280" />

          <g>
            <circle
              cx={particleX}
              cy={particleY}
              r={10 + masa}
              fill="#10b981"
              stroke="#059669"
              strokeWidth="2"
            />
            <text
              x={particleX}
              y={particleY + 4}
              textAnchor="middle"
              className="text-[10px] fill-white font-bold"
            >
              m
            </text>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${centerX} ${centerY}`}
              to={`${(angulo * 180) / Math.PI + 90} ${centerX} ${centerY}`}
              dur="0.1s"
              fill="freeze"
            />
          </g>

          {mostrarVectores && (
            <>
              <line
                x1={particleX}
                y1={particleY}
                x2={particleX - Math.sin(angulo - Math.PI / 2) * velocidad * 5}
                y2={particleY + Math.cos(angulo - Math.PI / 2) * velocidad * 5}
                stroke="#10b981"
                strokeWidth="3"
                markerEnd="url(#arrow-green)"
              />
              <text
                x={
                  particleX -
                  Math.sin(angulo - Math.PI / 2) * velocidad * 3 +
                  15
                }
                y={particleY + Math.cos(angulo - Math.PI / 2) * velocidad * 3}
                className="text-[10px] fill-emerald-500 font-mono font-bold"
              >
                v
              </text>
            </>
          )}

          {mostrarFuerza && (
            <>
              <line
                x1={particleX}
                y1={particleY}
                x2={particleX + fcX}
                y2={particleY + fcY}
                stroke="#ef4444"
                strokeWidth="4"
                markerEnd="url(#arrow-red)"
              />
              <text
                x={particleX + fcX / 2 - 20}
                y={particleY + fcY / 2 - 10}
                className="text-[10px] fill-red-500 font-mono font-bold"
              >
                Fc
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
            <marker
              id="arrow-red"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="p-3 bg-secondary/30 rounded-lg">
          <div className="text-xs text-muted-foreground">
            Velocidad tangencial
          </div>
          <div className="text-lg font-mono font-bold text-emerald-500">
            v = {velocidad.toFixed(1)} m/s
          </div>
        </div>
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
          <div className="text-xs text-red-400">Fuerza Centrípeta</div>
          <div className="text-lg font-mono font-bold text-red-500">
            Fc = {fuerzaCentripeta.toFixed(1)} N
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 bg-accent/10 rounded-lg">
        <div className="text-xs text-muted-foreground mb-2">Fórmulas:</div>
        <div className="text-sm font-mono space-y-1">
          <div className="text-emerald-500">
            v = ω·r → ω = {velocidad}/{radio} = {(velocidad / radio).toFixed(2)}{" "}
            rad/s
          </div>
          <div className="text-red-500 font-bold">
            Fc = m·v²/r = {masa}×{velocidad}²/{radio} ={" "}
            {fuerzaCentripeta.toFixed(1)} N
          </div>
        </div>
      </div>
    </div>
  );
}
