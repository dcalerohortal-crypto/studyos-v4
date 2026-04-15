import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DailyChallenge } from '@/types';
import { DAILY_CHALLENGES, XP_REWARDS } from '@/../../shared/const';
import { useGameState } from '@/hooks/useGameState';
import { Check, Lock, Zap } from 'lucide-react';

const DEFAULT_CHALLENGES: DailyChallenge[] = [
  {
    id: 'deporte-1',
    categoria: 'deporte',
    descripcion: '50 flexiones o 30 min de cardio',
    xpReward: XP_REWARDS.CHALLENGE_COMPLETE,
    completedToday: false,
  },
  {
    id: 'estudio-1',
    categoria: 'estudio',
    descripcion: '2 horas de estudio concentrado',
    xpReward: XP_REWARDS.CHALLENGE_COMPLETE,
    completedToday: false,
  },
  {
    id: 'salud-1',
    categoria: 'salud',
    descripcion: 'Beber 2L de agua y dormir 8h',
    xpReward: XP_REWARDS.CHALLENGE_COMPLETE,
    completedToday: false,
  },
  {
    id: 'mente-1',
    categoria: 'mente',
    descripcion: 'Leer 10 páginas o meditar 10 min',
    xpReward: XP_REWARDS.CHALLENGE_COMPLETE,
    completedToday: false,
  },
];

export default function DailyChallenges() {
  const today = new Date().toISOString().split('T')[0];
  const [challenges, setChallenges] = useLocalStorage<Record<string, DailyChallenge[]>>('studyos_challenges', {});
  const { completeChallenge } = useGameState();

  const todaysChallenges = challenges[today] || DEFAULT_CHALLENGES;
  const completedCount = todaysChallenges.filter(c => c.completedToday).length;
  const totalXP = todaysChallenges.reduce((sum, c) => sum + (c.completedToday ? c.xpReward : 0), 0);

  const toggleChallenge = (challengeId: string) => {
    const updated = todaysChallenges.map(c => {
      if (c.id === challengeId) {
        const newCompleted = !c.completedToday;
        if (newCompleted) {
          completeChallenge(challengeId);
        }
        return { ...c, completedToday: newCompleted };
      }
      return c;
    });

    setChallenges({
      ...challenges,
      [today]: updated,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Retos del Día</h1>
        <p className="text-muted-foreground">Completa los retos para ganar XP y mantener tu racha</p>
      </div>

      {/* Progress */}
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Progreso del Día</p>
            <p className="text-3xl font-bold text-foreground">{completedCount}/4</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">XP Ganado</p>
            <p className="text-3xl font-bold text-accent">+{totalXP}</p>
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {todaysChallenges.map(challenge => {
          const categoryInfo = DAILY_CHALLENGES.find(c => c.id === challenge.categoria);
          return (
            <div
              key={challenge.id}
              className={`glass-card p-6 transition-all cursor-pointer ${
                challenge.completedToday ? 'border-accent/50' : ''
              }`}
              onClick={() => toggleChallenge(challenge.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  challenge.completedToday
                    ? 'bg-accent/20'
                    : 'bg-secondary'
                }`}>
                  <Zap className={`w-6 h-6 ${
                    challenge.completedToday
                      ? 'text-accent'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div className={`p-2 rounded-lg ${
                  challenge.completedToday
                    ? 'bg-accent/20'
                    : 'bg-secondary'
                }`}>
                  {challenge.completedToday ? (
                    <Check className="w-5 h-5 text-accent" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {categoryInfo?.label}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {challenge.descripcion}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-accent font-semibold">+{challenge.xpReward} XP</span>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    challenge.completedToday
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChallenge(challenge.id);
                  }}
                >
                  {challenge.completedToday ? 'Completado' : 'Completar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus Info */}
      <div className="glass-card p-6 mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">💡 Consejo del Día</h3>
        <p className="text-muted-foreground">
          Completar todos los retos diarios no solo te da XP, sino que también construye hábitos que te harán más productivo. ¡Mantén la consistencia!
        </p>
      </div>
    </div>
  );
}
