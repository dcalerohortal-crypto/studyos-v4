import { useState, useCallback, useRef } from "react";

export type EffectType =
  | "confetti"
  | "particles"
  | "glow"
  | "shake"
  | "pulse"
  | "bounce"
  | "ripple"
  | "fireworks"
  | "shimmer";

export interface EffectOptions {
  intensity?: number;
  color?: string;
  duration?: number;
  particleCount?: number;
}

interface ActiveEffect {
  id: string;
  type: EffectType;
  options: EffectOptions;
}

export function useMicroInteractions() {
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const effectsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generar ID único
  const generateId = () =>
    `effect_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Activar un efecto
  const trigger = useCallback(
    (type: EffectType, options: EffectOptions = {}) => {
      const id = generateId();
      const defaultOptions = {
        intensity: 1,
        color: "#6366f1",
        duration: 2000,
        particleCount: 50,
        ...options,
      };

      const newEffect: ActiveEffect = { id, type, options: defaultOptions };

      setActiveEffects(prev => [...prev, newEffect]);

      // Auto-remove después de duration
      const timeout = setTimeout(() => {
        setActiveEffects(prev => prev.filter(e => e.id !== id));
      }, defaultOptions.duration);

      effectsRef.current.set(id, timeout);

      return id;
    },
    []
  );

  // Efectos predefinidos
  const celebrate = useCallback(
    () => trigger("confetti", { particleCount: 100, duration: 3000 }),
    [trigger]
  );
  const levelUp = useCallback(
    () => trigger("fireworks", { intensity: 2, duration: 4000 }),
    [trigger]
  );
  const xpGain = useCallback(
    (amount: number) => {
      if (amount >= 500) return trigger("particles", { particleCount: 80 });
      if (amount >= 100) return trigger("glow", { duration: 1500 });
      return trigger("pulse", { duration: 800 });
    },
    [trigger]
  );
  const streak = useCallback(
    () => trigger("fireworks", { intensity: 1.5, duration: 2500 }),
    [trigger]
  );
  const error = useCallback(
    () => trigger("shake", { duration: 500 }),
    [trigger]
  );
  const click = useCallback(
    () => trigger("ripple", { duration: 400 }),
    [trigger]
  );

  // Cancelar efecto específico
  const cancel = useCallback((id: string) => {
    const timeout = effectsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      effectsRef.current.delete(id);
    }
    setActiveEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  // Cancelar todos
  const cancelAll = useCallback(() => {
    effectsRef.current.forEach(timeout => clearTimeout(timeout));
    effectsRef.current.clear();
    setActiveEffects([]);
  }, []);

  return {
    activeEffects,
    trigger,
    celebrate,
    levelUp,
    xpGain,
    streak,
    error,
    click,
    cancel,
    cancelAll,
  };
}
