import { useState, useEffect, useRef, useCallback } from "react";

interface URMSimulatorProps {
  velocidadInicial?: number;
  posicionInicial?: number;
  tiempoActual?: number;
  mostrarGrafica?: boolean;
  mostrarVectores?: boolean;
  autoPlay?: boolean;
  onTiempoChange?: (tiempo: number) => void;
}

export default function URMSimulator({
  velocidadInicial: initialVelocidad = 5,
  posicionInicial: initialPosicion = 0,
  tiempoActual: externalTiempo,
  mostrarGrafica = true,
  mostrarVectores = true,
  autoPlay = false,
  onTiempoChange,
}: URMSimulatorProps) {
  const [velocidad, setVelocidad] = useState(initialVelocidad);
  const [posicion, setPosicion] = useState(initialPosicion);
  const [tiempo, setTiempo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const calcularPosicion = useCallback(
    (t: number) => initialPosicion + velocidad * t,
    [initialPosicion, velocidad]
  );

  useEffect(() => {
    if (externalTiempo !== undefined) {
      setTiempo(externalTiempo);
      setPosicion(calcularPosicion(externalTiempo));
    }
  }, [externalTiempo, calcularPosicion]);

  useEffect(() => {
    if (!isPlaying) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setTiempo(prev => {
        const newTiempo = prev + delta;
        if (onTiempoChange) onTiempoChange(newTiempo);
        return newTiempo;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, onTiempoChange]);

  useEffect(() => {
    setPosicion(calcularPosicion(tiempo));
  }, [tiempo, calcularPosicion]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const reset = () => {
    setTiempo(0);
    setPosicion(initialPosicion);
    setIsPlaying(false);
    lastTimeRef.current = 0;
  };

  const scale = 20;
  const trackLength = 400;
  const particleX = Math.min(
    Math.max(posicion * scale + trackLength / 2, 20),
    trackLength - 20
  );

  const generatePath = () => {
    const points: string[] = [];
    for (let t = 0; t <= Math.max(tiempo + 2, 5); t += 0.1) {
      const x = t;
      const y = initialPosicion + velocidad * t;
      const px = x * 30 + 50;
      const py = 200 - y * 15;
      points.push(`${px},${py}`);
    }
    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="w-full bg-card/50 rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-foreground">
          URM: Movimiento Rectilíneo Uniforme
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
            Velocidad (m/s)
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={velocidad}
            onChange={e => setVelocidad(parseFloat(e.target.value))}
            className="w-full accent-accent"
            disabled={isPlaying}
          />
          <span className="text-sm text-accent font-mono">
            {velocidad.toFixed(1)} m/s
          </span>
        </div>
        <div className="text-center px-4 py-2 bg-secondary/30 rounded-lg">
          <div className="text-xs text-muted-foreground">Tiempo</div>
          <div className="text-xl font-mono font-bold text-accent">
            {tiempo.toFixed(2)} s
          </div>
        </div>
        <div className="text-center px-4 py-2 bg-secondary/30 rounded-lg">
          <div className="text-xs text-muted-foreground">Posición</div>
          <div className="text-xl font-mono font-bold text-accent">
            {posicion.toFixed(2)} m
          </div>
        </div>
      </div>

      <div className="bg-secondary/20 rounded-lg p-4 mb-4">
        <div className="relative h-16 overflow-hidden">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border" />
          <div className="absolute top-1/2 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground">
            <span>0m</span>
            <span>{initialPosicion}m</span>
            <span>20m</span>
          </div>

          {mostrarVectores && (
            <div
              className="absolute top-1/2 w-12 h-1 bg-violet-500 transform -translate-y-1/2"
              style={{ left: particleX - 24 }}
            >
              <svg
                viewBox="0 0 48 12"
                className="absolute right-0 top-0 w-4 h-4"
              >
                <path d="M0 6 L10 0 L10 12 Z" fill="#8b5cf6" />
              </svg>
            </div>
          )}

          <div
            className="absolute top-1/2 w-4 h-4 bg-accent rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all"
            style={{ left: particleX }}
          >
            <div className="absolute inset-0 bg-accent/50 rounded-full animate-ping" />
          </div>
        </div>
      </div>

      {mostrarGrafica && (
        <div className="bg-secondary/20 rounded-lg p-3">
          <div className="text-sm font-medium text-foreground mb-2">
            Gráfica x-t
          </div>
          <svg viewBox="0 0 250 120" className="w-full h-32">
            <line
              x1="40"
              y1="100"
              x2="240"
              y2="100"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1"
            />
            <line
              x1="40"
              y1="10"
              x2="40"
              y2="100"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1"
            />

            <text x="235" y="115" className="text-[8px] fill-muted-foreground">
              t
            </text>
            <text x="25" y="15" className="text-[8px] fill-muted-foreground">
              x
            </text>

            <path
              d={generatePath()}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <circle
              cx={50 + tiempo * 30}
              cy={100 - (initialPosicion + velocidad * tiempo) * 15}
              r="4"
              fill="#8b5cf6"
            />

            <text x="50" y="110" className="text-[7px] fill-muted-foreground">
              0
            </text>
            <text x="230" y="110" className="text-[7px] fill-muted-foreground">
              5s
            </text>
          </svg>
          <div className="mt-2 text-center">
            <span className="text-xs text-muted-foreground">Ecuación: </span>
            <span className="text-sm font-mono text-accent">
              x = {initialPosicion} + {velocidad}·t
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 p-3 bg-accent/10 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">
          Fórmulas del MRU:
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-mono">x = x₀ + v·t</div>
          <div className="font-mono">v = {velocidad} m/s (constante)</div>
        </div>
      </div>
    </div>
  );
}
