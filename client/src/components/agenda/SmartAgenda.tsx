import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Check,
  Plus,
  Clock,
  Zap,
  GripVertical,
  ChevronRight,
  MoreVertical,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameState } from "@/hooks/useGameState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LEVEL_UP_THRESHOLD } from "@/../../shared/const";

interface Routine {
  id: string;
  title: string;
  category: "deporte" | "estudio" | "salud" | "mente";
  xpReward: number;
  schedule: {
    recurrence: "daily" | "weekly" | "custom";
    time: string;
    days?: string[];
  };
  isActive: boolean;
  completedToday: boolean;
  completedAt?: string;
  createdAt: string;
}

interface SmartAgendaProps {
  className?: string;
  onComplete?: (routine: Routine, xpEarned: number) => void;
}

export function SmartAgenda({ className, onComplete }: SmartAgendaProps) {
  const [routines, setRoutines] = useLocalStorage<Routine[]>(
    "studyos_routines",
    []
  );
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "deporte" | "estudio" | "salud" | "mente"
  >("estudio");
  const [showXP, setShowXP] = useState<{ id: string; amount: number } | null>(
    null
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const { addXP, profile } = useGameState();

  const today = new Date().toISOString().split("T")[0];

  const addRoutine = () => {
    if (!newRoutineTitle.trim()) return;

    const newRoutine: Routine = {
      id: `routine_${Date.now()}`,
      title: newRoutineTitle,
      category: selectedCategory,
      xpReward: 50,
      schedule: { recurrence: "daily", time: "09:00" },
      isActive: true,
      completedToday: false,
      createdAt: new Date().toISOString(),
    };

    setRoutines([...routines, newRoutine]);
    setNewRoutineTitle("");
  };

  const completeRoutine = useCallback(
    (routineId: string) => {
      const routine = routines.find(r => r.id === routineId);
      if (!routine || routine.completedToday) return;

      const previousLevel = profile.nivel;

      setRoutines(
        routines.map(r =>
          r.id === routineId
            ? {
                ...r,
                completedToday: true,
                completedAt: new Date().toISOString(),
              }
            : r
        )
      );

      addXP(
        routine.xpReward,
        undefined,
        `Rutina: ${routines.find(r => r.id === routineId)?.title}`
      );

      setShowXP({ id: routineId, amount: routine.xpReward });

      setTimeout(() => setShowXP(null), 1500);

      const newLevel =
        Math.floor((profile.xpTotal + routine.xpReward) / LEVEL_UP_THRESHOLD) +
        1;
      if (newLevel > previousLevel) {
        setShowConfetti(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"],
        });
        setTimeout(() => setShowConfetti(false), 3000);
      }

      onComplete?.(routine, routine.xpReward);
    },
    [routines, profile, addXP, onComplete]
  );

  const deleteRoutine = (routineId: string) => {
    setRoutines(routines.filter(r => r.id !== routineId));
  };

  const toggleRoutine = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    if (routine.completedToday) {
      setRoutines(
        routines.map(r =>
          r.id === routineId
            ? { ...r, completedToday: false, completedAt: undefined }
            : r
        )
      );
    } else {
      completeRoutine(routineId);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      deporte: "#EF4444",
      estudio: "#3B82F6",
      salud: "#10B981",
      mente: "#F59E0B",
    };
    return colors[category] || "#6366f1";
  };

  const activeRoutines = routines.filter(r => r.isActive);
  const completedRoutines = activeRoutines.filter(r => r.completedToday);
  const pendingRoutines = activeRoutines.filter(r => !r.completedToday);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newRoutineTitle}
            onChange={e => setNewRoutineTitle(e.target.value)}
            placeholder="Nueva rutina..."
            className="flex-1 bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            onKeyPress={e => e.key === "Enter" && addRoutine()}
          />
          <select
            value={selectedCategory}
            onChange={e =>
              setSelectedCategory(e.target.value as typeof selectedCategory)
            }
            className="bg-secondary text-foreground rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="deporte">Deporte</option>
            <option value="estudio">Estudio</option>
            <option value="salud">Salud</option>
            <option value="mente">Mente</option>
          </select>
          <button
            onClick={addRoutine}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-2 font-medium transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="pop">
        {pendingRoutines.length === 0 && completedRoutines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <p className="text-muted-foreground">Crea tu primera rutina</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {pendingRoutines.map(
              (routine, index) =>
                routine.isActive && (
                  <motion.div
                    key={routine.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                    className={cn(
                      "group relative glass-card p-4 cursor-pointer transition-all hover:scale-[1.01]",
                      routine.completedToday && "opacity-50"
                    )}
                    onClick={() => toggleRoutine(routine.id)}
                  >
                    <AnimatePresence>
                      {showXP?.id === routine.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.5 }}
                          animate={{ opacity: 1, y: -50, scale: 1.2 }}
                          exit={{ opacity: 0, y: -100 }}
                          className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                        >
                          <div className="bg-accent text-accent-foreground font-bold px-3 py-1 rounded-full text-lg shadow-lg">
                            +{showXP.amount} XP
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-3">
                      <button className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </button>

                      <button
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all",
                          routine.completedToday
                            ? "bg-accent border-accent"
                            : "border-border hover:border-accent hover:bg-accent/20"
                        )}
                      >
                        {routine.completedToday && (
                          <Check className="h-4 w-4 text-accent-foreground" />
                        )}
                      </button>

                      <div className="flex-1">
                        <h3
                          className={cn(
                            "font-medium",
                            routine.completedToday &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {routine.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {routine.schedule.time}
                          </span>
                          <span
                            className="flex items-center gap-1"
                            style={{
                              color: getCategoryColor(routine.category),
                            }}
                          >
                            <Zap className="h-3 w-3" />+{routine.xpReward} XP
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteRoutine(routine.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 rounded-lg transition-all"
                      >
                        <MoreVertical className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                )
            )}

            {completedRoutines.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-4"
              >
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Completados hoy ({completedRoutines.length})
                </p>
                <div className="space-y-2">
                  {completedRoutines.map(routine => (
                    <motion.div
                      key={routine.id}
                      layout
                      className="glass-card p-3 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-accent" />
                        <span className="text-sm line-through text-muted-foreground">
                          {routine.title}
                        </span>
                        <span className="ml-auto text-xs text-accent">
                          +{routine.xpReward} XP
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
