import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Habit } from '@/types';
import { DAILY_CHALLENGES } from '@/../../shared/const';
import { useGameState } from '@/hooks/useGameState';
import { Check, Plus, Trash2 } from 'lucide-react';

export default function HabitsTracker() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('studyos_habits', []);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'deporte' | 'estudio' | 'salud' | 'mente'>('estudio');
  const { completeHabit } = useGameState();

  const today = new Date().toISOString().split('T')[0];

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
    setNewHabitName('');
  };

  const toggleHabitToday = (habitId: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completedDates.includes(today);
        const newDates = isCompleted
          ? habit.completedDates.filter(d => d !== today)
          : [...habit.completedDates, today];

        if (!isCompleted) {
          completeHabit(habitId);
        }

        return { ...habit, completedDates: newDates };
      }
      return habit;
    }));
  };

  const deleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId));
  };

  // GitHub-style contribution graph
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const getCompletionColor = (date: string, habit: Habit) => {
    const isCompleted = habit.completedDates.includes(date);
    if (!isCompleted) return 'bg-secondary';
    return 'bg-accent';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mis Hábitos</h1>
        <p className="text-muted-foreground">Construye consistencia, un día a la vez</p>
      </div>

      {/* Add Habit Form */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Nuevo Hábito</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Nombre del hábito (ej: Beber 2L de agua)"
            className="flex-1 bg-secondary text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            onKeyPress={(e) => e.key === 'Enter' && addHabit()}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-secondary text-foreground rounded-xl px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {DAILY_CHALLENGES.map(challenge => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.label}
              </option>
            ))}
          </select>
          <button
            onClick={addHabit}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-6 py-3 font-semibold flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Añadir</span>
          </button>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground">Aún no has creado ningún hábito. ¡Empieza ahora!</p>
          </div>
        ) : (
          habits.map(habit => (
            <div key={habit.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{habit.nombre}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{habit.categoria}</p>
                </div>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>

              {/* Contribution Graph */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-3">Últimos 30 días</p>
                <div className="grid grid-cols-10 gap-1">
                  {getLast30Days().map(date => (
                    <button
                      key={date}
                      onClick={() => toggleHabitToday(habit.id)}
                      className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${getCompletionColor(date, habit)}`}
                      title={date}
                    />
                  ))}
                </div>
              </div>

              {/* Today's Status */}
              <button
                onClick={() => toggleHabitToday(habit.id)}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  habit.completedDates.includes(today)
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <Check className="w-4 h-4" />
                {habit.completedDates.includes(today) ? 'Completado hoy' : 'Marcar como completado'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
