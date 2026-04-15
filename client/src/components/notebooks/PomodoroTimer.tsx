import { usePomodoro } from "@/hooks/usePomodoro";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

interface PomodoroTimerProps {
  onComplete?: () => void;
  compact?: boolean;
}

export default function PomodoroTimer({
  onComplete,
  compact = false,
}: PomodoroTimerProps) {
  const {
    state,
    timeLeftFormatted,
    sessions,
    progress,
    stateDisplay,
    isRunning,
    isPaused,
    isBreak,
    isIdle,
    start,
    pause,
    resume,
    reset,
    skipBreak,
  } = usePomodoro();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={isIdle ? start : isRunning ? pause : resume}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isBreak
              ? "bg-emerald-500/20 text-emerald-400"
              : isRunning
                ? "bg-red-500/20 text-red-400"
                : "bg-accent/20 text-accent"
          }`}
        >
          <span>{isIdle ? "▶" : isRunning ? "⏸" : "▶"}</span>
          <span className="font-mono">{timeLeftFormatted}</span>
        </button>

        {!isIdle && (
          <button
            onClick={reset}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            title="Reiniciar"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{stateDisplay.emoji}</span>
          <div>
            <p className={`text-xs font-semibold ${stateDisplay.color}`}>
              {stateDisplay.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Sesión {sessions + 1}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          {!isBreak && (
            <>
              {isIdle && (
                <button
                  onClick={start}
                  className="p-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors"
                  title="Iniciar estudio"
                >
                  <Play className="w-4 h-4 text-accent-foreground" />
                </button>
              )}

              {isRunning && (
                <button
                  onClick={pause}
                  className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
                  title="Pausar"
                >
                  <Pause className="w-4 h-4 text-yellow-500" />
                </button>
              )}

              {isPaused && (
                <button
                  onClick={resume}
                  className="p-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors"
                  title="Continuar"
                >
                  <Play className="w-4 h-4 text-accent-foreground" />
                </button>
              )}
            </>
          )}

          {isBreak && (
            <button
              onClick={skipBreak}
              className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              title="Saltar descanso"
            >
              <Coffee className="w-4 h-4 text-foreground" />
            </button>
          )}

          {!isIdle && (
            <button
              onClick={reset}
              className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-3">
        <p className="text-4xl font-bold font-mono text-foreground">
          {timeLeftFormatted}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isBreak ? "bg-emerald-500" : isRunning ? "bg-red-500" : "bg-accent"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hint */}
      {isBreak && (
        <p className="text-center text-xs text-emerald-400 mt-2">
          ¡Descansa! Has completado {sessions} sesión
          {sessions !== 1 ? "es" : ""}
        </p>
      )}

      {!isBreak && !isRunning && !isPaused && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Pulsa play para empezar el estudio
        </p>
      )}
    </div>
  );
}
