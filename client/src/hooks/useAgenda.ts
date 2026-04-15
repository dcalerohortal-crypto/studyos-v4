import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useGameState } from "./useGameState";

interface Schedule {
  recurrence: "daily" | "weekly" | "custom";
  time: string;
  days?: string[];
}

interface Routine {
  id: string;
  title: string;
  category: "deporte" | "estudio" | "salud" | "mente";
  xpReward: number;
  schedule: Schedule;
  isActive: boolean;
  completedToday: boolean;
  completedAt?: string;
  createdAt: string;
}

interface RoutineStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export function useAgenda() {
  const [routines, setRoutines] = useLocalStorage<Routine[]>(
    "studyos_routines",
    []
  );
  const { addXP, profile } = useGameState();

  const getTodayRoutines = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString("es-ES", {
      weekday: "lowercase",
    });

    return routines.filter(routine => {
      if (!routine.isActive) return false;

      if (routine.schedule.recurrence === "daily") return true;

      if (routine.schedule.recurrence === "weekly") {
        return routine.schedule.days?.includes(dayOfWeek) ?? true;
      }

      return true;
    });
  }, [routines]);

  const getPendingRoutines = useCallback(() => {
    return getTodayRoutines().filter(r => !r.completedToday);
  }, [getTodayRoutines]);

  const getCompletedRoutines = useCallback(() => {
    return getTodayRoutines().filter(r => r.completedToday);
  }, [getTodayRoutines]);

  const getRoutineStats = useCallback((): RoutineStats => {
    const today = getTodayRoutines();
    const completed = today.filter(r => r.completedToday).length;
    const total = today.length;

    return {
      total,
      completed,
      pending: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [getTodayRoutines]);

  const completeRoutine = useCallback(
    (routineId: string) => {
      const routine = routines.find(r => r.id === routineId);
      if (!routine || routine.completedToday) return false;

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

      addXP(routine.xpReward, undefined, `Rutina completada: ${routine.title}`);

      return true;
    },
    [routines, setRoutines, addXP]
  );

  const uncompleteRoutine = useCallback(
    (routineId: string) => {
      setRoutines(
        routines.map(r =>
          r.id === routineId
            ? { ...r, completedToday: false, completedAt: undefined }
            : r
        )
      );
    },
    [routines, setRoutines]
  );

  const addRoutine = useCallback(
    (
      routine: Omit<
        Routine,
        "id" | "completedToday" | "completedAt" | "createdAt"
      >
    ) => {
      const newRoutine: Routine = {
        ...routine,
        id: `routine_${Date.now()}`,
        completedToday: false,
        createdAt: new Date().toISOString(),
      };

      setRoutines([...routines, newRoutine]);
      return newRoutine;
    },
    [routines, setRoutines]
  );

  const updateRoutine = useCallback(
    (routineId: string, updates: Partial<Routine>) => {
      setRoutines(
        routines.map(r => (r.id === routineId ? { ...r, ...updates } : r))
      );
    },
    [routines, setRoutines]
  );

  const deleteRoutine = useCallback(
    (routineId: string) => {
      setRoutines(routines.filter(r => r.id !== routineId));
    },
    [routines, setRoutines]
  );

  const rescheduleRoutine = useCallback(
    (routineId: string, newTime: string) => {
      setRoutines(
        routines.map(r =>
          r.id === routineId
            ? { ...r, schedule: { ...r.schedule, time: newTime } }
            : r
        )
      );
    },
    [routines, setRoutines]
  );

  const getRoutineHistory = useCallback(
    (routineId: string, days: number = 7) => {
      const history: { date: string; completed: boolean }[] = [];
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const routine = routines.find(r => r.id === routineId);
        history.push({
          date: dateStr,
          completed: routine?.completedAt?.startsWith(dateStr) ?? false,
        });
      }

      return history;
    },
    [routines]
  );

  const getRoutinesByCategory = useCallback(
    (category: Routine["category"]) => {
      return routines.filter(r => r.category === category && r.isActive);
    },
    [routines]
  );

  return {
    routines,
    getTodayRoutines,
    getPendingRoutines,
    getCompletedRoutines,
    getRoutineStats,
    completeRoutine,
    uncompleteRoutine,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    rescheduleRoutine,
    getRoutineHistory,
    getRoutinesByCategory,
  };
}
