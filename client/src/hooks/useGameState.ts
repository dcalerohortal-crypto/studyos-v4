import { useCallback, useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { UserProfile, SubjectXP, ActivityLog } from "@/types";
import { LEVEL_UP_THRESHOLD, XP_REWARDS } from "@/../../shared/const";

export function useGameState() {
  const [profile, setProfile] = useLocalStorage<UserProfile>(
    "studyos_profile",
    {
      nombre: "Estudiante",
      curso: "4º ESO",
      xpTotal: 0,
      nivel: 1,
      racha: 0,
      createdAt: new Date().toISOString(),
    }
  );

  const [subjectsXP, setSubjectsXP] = useLocalStorage<
    Record<string, SubjectXP>
  >("studyos_subjects", {});
  const [activityLog, setActivityLog] = useLocalStorage<ActivityLog[]>(
    "studyos_activity",
    []
  );

  const addXP = useCallback(
    (amount: number, subjectId?: string, logText?: string) => {
      // Update profile
      setProfile({
        ...profile,
        xpTotal: profile.xpTotal + amount,
        nivel: Math.floor((profile.xpTotal + amount) / LEVEL_UP_THRESHOLD) + 1,
      });

      // Update subject XP if provided
      if (subjectId) {
        const current = subjectsXP[subjectId] || {
          id: subjectId,
          xp_total: 0,
          xp_en_nivel: 0,
          nivel: 1,
          lastUpdated: new Date().toISOString(),
        };
        const newXpTotal = current.xp_total + amount;
        const newNivel = Math.floor(newXpTotal / LEVEL_UP_THRESHOLD) + 1;

        setSubjectsXP({
          ...subjectsXP,
          [subjectId]: {
            ...current,
            xp_total: newXpTotal,
            xp_en_nivel: newXpTotal % LEVEL_UP_THRESHOLD,
            nivel: newNivel,
            lastUpdated: new Date().toISOString(),
          },
        });
      }

      // Log activity
      if (logText) {
        setActivityLog([
          {
            tipo: "xp" as const,
            texto: logText,
            timestamp: new Date().toISOString(),
            xpGanado: amount,
          },
          ...activityLog.slice(0, 49),
        ]);
      }
    },
    [
      profile,
      subjectsXP,
      activityLog,
      setProfile,
      setSubjectsXP,
      setActivityLog,
    ]
  );

  const completeChallenge = useCallback(
    (challengeId: string) => {
      addXP(
        XP_REWARDS.CHALLENGE_COMPLETE,
        "",
        `Reto completado: ${challengeId}`
      );
    },
    [addXP]
  );

  const completeHabit = useCallback(
    (habitId: string) => {
      addXP(XP_REWARDS.HABIT_COMPLETE, "", `Hábito completado: ${habitId}`);
    },
    [addXP]
  );

  return {
    profile,
    subjectsXP,
    activityLog,
    addXP,
    completeChallenge,
    completeHabit,
    setProfile,
  };
}

export function getLast7DaysXP(activityLog: ActivityLog[]) {
  const days = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
  return Array.from({length: 7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const xp = activityLog.filter(a => a.timestamp.startsWith(dateStr))
      .reduce((sum, a) => sum + (a.xpGanado || 0), 0);
    return { day: days[d.getDay()], xp };
  });
}
