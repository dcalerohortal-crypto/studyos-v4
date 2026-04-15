import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Habit } from "@/types";
import { DAILY_CHALLENGES } from "@/../../shared/const";
import { useGameState } from "@/hooks/useGameState";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface HabitListProps {
  className?: string;
  onComplete?: (habitId: string) => void;
}

export function HabitList({ className, onComplete }: HabitListProps) {
  const [habits, setHabits] = useLocalStorage<Habit[]>("studyos_habits", []);
  const [newHabitName, setNewHabitName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "deporte" | "estudio" | "salud" | "mente"
  >("estudio");
  const { completeHabit } = useGameState();

  const today = new Date().toISOString().split("T")[0];

  const addHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      nombre: newHabitName,
      categoria: selectedCategory,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    setHabits([...habits, newHabit]);
    setNewHabitName("");
  };

  const toggleHabit = (habitId: string) => {
    setHabits(
      habits.map(habit => {
        if (habit.id === habitId) {
          const isCompleted = habit.completedDates.includes(today);
          const newDates = isCompleted
            ? habit.completedDates.filter(d => d !== today)
            : [...habit.completedDates, today];

          if (!isCompleted) {
            completeHabit(habitId);
            onComplete?.(habitId);
          }

          return { ...habit, completedDates: newDates };
        }
        return habit;
      })
    );
  };

  const deleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId));
  };

  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split("T")[0]);
    }
    return days;
  };

  const getCompletionColor = (date: string, habit: Habit) => {
    return habit.completedDates.includes(date) ? "bg-accent" : "bg-secondary";
  };

  const isCompletedToday = (habit: Habit) =>
    habit.completedDates.includes(today);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newHabitName}
            onChange={e => setNewHabitName(e.target.value)}
            placeholder="Nuevo hábito..."
            className="flex-1 bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            onKeyPress={e => e.key === "Enter" && addHabit()}
          />
          <select
            value={selectedCategory}
            onChange={e =>
              setSelectedCategory(e.target.value as typeof selectedCategory)
            }
            className="bg-secondary text-foreground rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {DAILY_CHALLENGES.map(challenge => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.label}
              </option>
            ))}
          </select>
          <button
            onClick={addHabit}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-2 font-medium transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="pop">
          {habits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 text-center"
            >
              <p className="text-muted-foreground">
                Crea tu primer hábito para empezar
              </p>
            </motion.div>
          ) : (
            habits.map(
              (habit, index) =>
                habit.categoria === selectedCategory && (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "glass-card p-4 transition-all",
                      isCompletedToday(habit) && "border-accent/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all",
                            isCompletedToday(habit)
                              ? "bg-accent border-accent"
                              : "border-border hover:border-accent"
                          )}
                        >
                          {isCompletedToday(habit) && (
                            <Check className="h-4 w-4 text-accent-foreground" />
                          )}
                        </button>
                        <div>
                          <h3
                            className={cn(
                              "font-medium",
                              isCompletedToday(habit) &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {habit.nombre}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                            <Flame
                              className={cn(
                                "h-3 w-3",
                                isCompletedToday(habit) && "text-orange-500"
                              )}
                            />
                            {habit.categoria}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">30 días</p>
                      <div className="grid grid-cols-10 gap-1">
                        {getLast30Days().map(date => (
                          <button
                            key={date}
                            onClick={() => toggleHabit(habit.id)}
                            className={cn(
                              "h-5 w-5 rounded transition-all hover:scale-125",
                              getCompletionColor(date, habit)
                            )}
                            title={date}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function HabitHeatmap({
  habits,
  className,
}: {
  habits: Habit[];
  className?: string;
}) {
  const getYearData = () => {
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split("T")[0],
        count: habits.filter(h =>
          h.completedDates.includes(date.toISOString().split("T")[0])
        ).length,
      });
    }
    return days;
  };

  const yearData = getYearData();
  const maxCount = Math.max(...yearData.map(d => d.count));

  const getColor = (count: number) => {
    if (count === 0) return "bg-secondary";
    if (count === 1) return "bg-accent/25";
    if (count === 2) return "bg-accent/50";
    if (count >= 3) return "bg-accent";
    return "bg-secondary";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-muted-foreground">Contribution Graph</p>
      <div className="flex flex-wrap gap-1">
        {yearData.map((day, i) => (
          <div
            key={day.date}
            className={cn(
              "h-3 w-3 rounded-sm transition-all hover:ring-2 hover:ring-accent",
              getColor(day.count),
              day.count > 0 && "cursor-pointer"
            )}
            title={`${day.date}: ${day.count} hábitos`}
          />
        ))}
      </div>
    </div>
  );
}
