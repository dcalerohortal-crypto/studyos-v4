import { useCallback, useEffect, useState, useRef } from "react";
import { PomodoroState } from "@/types";

interface PomodoroConfig {
  studyMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  studyMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

export function usePomodoro(config: Partial<PomodoroConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<PomodoroState>("idle");
  const [timeLeft, setTimeLeft] = useState(finalConfig.studyMinutes * 60);
  const [sessions, setSessions] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calcular tiempo según estado
  const getTimeForState = useCallback(
    (s: PomodoroState): number => {
      switch (s) {
        case "running":
        case "idle":
          return finalConfig.studyMinutes * 60;
        case "break":
          if ((sessions + 1) % finalConfig.sessionsBeforeLongBreak === 0) {
            return finalConfig.longBreakMinutes * 60;
          }
          return finalConfig.breakMinutes * 60;
        case "paused":
          return timeLeft;
        default:
          return finalConfig.studyMinutes * 60;
      }
    },
    [finalConfig, sessions, timeLeft]
  );

  // Formatear tiempo
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Iniciar
  const start = useCallback(() => {
    setState("running");
  }, []);

  // Pausar
  const pause = useCallback(() => {
    setState("paused");
  }, []);

  // Continuar
  const resume = useCallback(() => {
    setState("running");
  }, []);

  // Reiniciar
  const reset = useCallback(() => {
    setState("idle");
    setTimeLeft(finalConfig.studyMinutes * 60);
  }, [finalConfig.studyMinutes]);

  // Saltar al descanso
  const skipToBreak = useCallback(() => {
    setSessions(prev => prev + 1);
    setState("break");
    setTimeLeft(getTimeForState("break"));
  }, [getTimeForState]);

  // Saltar descanso
  const skipBreak = useCallback(() => {
    setState("idle");
    setTimeLeft(finalConfig.studyMinutes * 60);
  }, [finalConfig.studyMinutes]);

  // Callback cuando termina el temporizador
  const [onComplete, setOnComplete] = useState<(() => void) | null>(null);

  // Efecto del temporizador
  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer terminado
            if (state === "running") {
              // Fin de sesión de estudio
              setSessions(s => s + 1);
              setSessionsToday(t => t + 1);
              setState("break");
              setTimeLeft(getTimeForState("break"));

              // Llamar callback si existe
              if (onComplete) {
                onComplete();
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state, getTimeForState, onComplete]);

  // Get estado para display
  const getStateDisplay = useCallback((): {
    label: string;
    emoji: string;
    color: string;
  } => {
    switch (state) {
      case "running":
        return { label: "ESTUDIO", emoji: "🍅", color: "text-red-500" };
      case "paused":
        return { label: "PAUSADO", emoji: "⏸️", color: "text-yellow-500" };
      case "break":
        return { label: "DESCANSO", emoji: "☕", color: "text-emerald-500" };
      default:
        return { label: "LISTO", emoji: "⏹️", color: "text-muted-foreground" };
    }
  }, [state]);

  // Calcular progreso
  const getProgress = useCallback((): number => {
    let totalTime: number;
    switch (state) {
      case "running":
        totalTime = finalConfig.studyMinutes * 60;
        break;
      case "break":
        if ((sessions + 1) % finalConfig.sessionsBeforeLongBreak === 0) {
          totalTime = finalConfig.longBreakMinutes * 60;
        } else {
          totalTime = finalConfig.breakMinutes * 60;
        }
        break;
      default:
        return 0;
    }
    return ((totalTime - timeLeft) / totalTime) * 100;
  }, [state, timeLeft, sessions, finalConfig]);

  // Reseteo diario (opcional, se puede llamar manualmente)
  const resetDaily = useCallback(() => {
    setSessionsToday(0);
    setStreakCount(0);
  }, []);

  return {
    state,
    timeLeft,
    timeLeftFormatted: formatTime(timeLeft),
    sessions,
    sessionsToday,
    streakCount,
    progress: getProgress(),
    stateDisplay: getStateDisplay(),
    isStudy: state === "running" || state === "idle",
    isBreak: state === "break",
    isPaused: state === "paused",
    isIdle: state === "idle",
    start,
    pause,
    resume,
    reset,
    skipToBreak,
    skipBreak,
    resetDaily,
    setOnComplete,
    config: finalConfig,
  };
}
