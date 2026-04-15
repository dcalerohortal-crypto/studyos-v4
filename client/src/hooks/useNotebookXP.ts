import { useCallback, useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  NotebookXP,
  Achievement,
  StudySession,
  NOTEBOOK_LEVELS,
  ACHIEVEMENTS,
  XP_AWARDS,
} from "@/types";

const STORAGE_KEY_PREFIX = "studyos_notebook_xp_";
const SESSION_XP_THRESHOLD = 100;

export function useNotebookXP(notebookId: string) {
  const [currentSessionXP, setCurrentSessionXP] = useState(0);
  const [recentAchievement, setRecentAchievement] =
    useState<Achievement | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [testStreak, setTestStreak] = useState(0);

  const storageKey = `${STORAGE_KEY_PREFIX}${notebookId}`;

  const [notebookXP, setNotebookXP] = useLocalStorage<NotebookXP>(storageKey, {
    notebookId,
    xp: 0,
    level: 1,
    achievements: [],
    studyHistory: [],
    streakCount: 0,
    lastStudyDate: new Date().toISOString().split("T")[0],
  });

  const addXP = useCallback(
    (amount: number, action?: string) => {
      const newXP = notebookXP.xp + amount;
      const newSessionXP = currentSessionXP + amount;
      setCurrentSessionXP(newSessionXP);

      // Calcular nuevo nivel
      let newLevel = 1;
      for (let i = NOTEBOOK_LEVELS.length - 1; i >= 0; i--) {
        if (newXP >= NOTEBOOK_LEVELS[i].xpRequired) {
          newLevel = NOTEBOOK_LEVELS[i].level;
          break;
        }
      }

      setNotebookXP({
        ...notebookXP,
        xp: newXP,
        level: newLevel,
        lastStudyDate: new Date().toISOString().split("T")[0],
      });

      // Verificar logros
      checkAchievements(newSessionXP, newLevel, action);

      // Verificar descansillo ganado
      if (
        newSessionXP >= SESSION_XP_THRESHOLD &&
        currentSessionXP < SESSION_XP_THRESHOLD
      ) {
        unlockAchievement("rest_earned");
      }
    },
    [notebookXP, currentSessionXP, setNotebookXP]
  );

  const checkAchievements = useCallback(
    (sessionXP: number, level: number, action?: string) => {
      // Primera respuesta correcta
      if (action === "test_correct" && notebookXP.streakCount === 0) {
        unlockAchievement("first_test");
      }

      // Racha de 5
      if (testStreak >= 4) {
        unlockAchievement("streak_5");
      }

      // Nivel 5 alcanzado
      if (level >= 5) {
        unlockAchievement("topic_master");
      }

      // 100 XP en sesión
      if (sessionXP >= SESSION_XP_THRESHOLD) {
        unlockAchievement("rest_earned");
      }
    },
    [notebookXP.streakCount, testStreak]
  );

  const unlockAchievement = useCallback(
    (achievementId: string) => {
      const achievementDef = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!achievementDef) return;

      // Verificar si ya está desbloqueado
      if (notebookXP.achievements.some(a => a.id === achievementId)) return;

      const newAchievement: Achievement = {
        ...achievementDef,
        unlockedAt: new Date().toISOString(),
      };

      setNotebookXP({
        ...notebookXP,
        achievements: [...notebookXP.achievements, newAchievement],
        xp: notebookXP.xp + achievementDef.xpBonus,
      });

      setRecentAchievement(newAchievement);
      setShowAchievement(true);

      // Ocultar popup después de 3 segundos
      setTimeout(() => {
        setShowAchievement(false);
      }, 3000);
    },
    [notebookXP, setNotebookXP]
  );

  const recordTestAnswer = useCallback(
    (correct: boolean) => {
      if (correct) {
        addXP(XP_AWARDS.TEST_CORRECT, "test_correct");
        const newStreak = testStreak + 1;
        setTestStreak(newStreak);

        if (newStreak >= 5) {
          addXP(XP_AWARDS.TEST_STREAK_BONUS, "test_streak");
        }
      } else {
        setTestStreak(0);
      }
    },
    [addXP, testStreak]
  );

  const completeTest = useCallback(
    (correctCount: number, totalCount: number) => {
      addXP(XP_AWARDS.TEST_COMPLETE, "test_complete");
      setTestStreak(0);
    },
    [addXP]
  );

  const completePomodoro = useCallback(
    (streakCount: number) => {
      addXP(XP_AWARDS.POMODORO_COMPLETE, "pomodoro_complete");

      if (streakCount >= 3) {
        addXP(XP_AWARDS.POMODORO_STREAK_BONUS, "pomodoros_3");
        unlockAchievement("pomodoros_3");
      }
    },
    [addXP, unlockAchievement]
  );

  const getXPForNextLevel = useCallback(() => {
    const currentLevelIndex = NOTEBOOK_LEVELS.findIndex(
      l => l.level === notebookXP.level
    );
    if (currentLevelIndex >= NOTEBOOK_LEVELS.length - 1) return null;
    return NOTEBOOK_LEVELS[currentLevelIndex + 1].xpRequired;
  }, [notebookXP.level]);

  const getXPProgress = useMemo(() => {
    const currentLevelIndex = NOTEBOOK_LEVELS.findIndex(
      l => l.level === notebookXP.level
    );
    const currentLevel = NOTEBOOK_LEVELS[currentLevelIndex];
    const nextLevel = NOTEBOOK_LEVELS[currentLevelIndex + 1];

    if (!nextLevel)
      return {
        current: notebookXP.xp,
        required: notebookXP.xp,
        percentage: 100,
      };

    const xpInLevel = notebookXP.xp - currentLevel.xpRequired;
    const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired;
    const percentage = Math.min(100, (xpInLevel / xpNeeded) * 100);

    return {
      current: xpInLevel,
      required: xpNeeded,
      percentage,
    };
  }, [notebookXP.xp, notebookXP.level]);

  const resetSession = useCallback(() => {
    setCurrentSessionXP(0);
    setTestStreak(0);
  }, []);

  const dismissAchievement = useCallback(() => {
    setShowAchievement(false);
  }, []);

  return {
    notebookXP,
    currentSessionXP,
    testStreak,
    recentAchievement,
    showAchievement,
    addXP,
    recordTestAnswer,
    completeTest,
    completePomodoro,
    unlockAchievement,
    getXPForNextLevel,
    getXPProgress,
    resetSession,
    dismissAchievement,
    NOTEBOOK_LEVELS,
    ACHIEVEMENTS,
    XP_AWARDS,
    SESSION_XP_THRESHOLD,
  };
}
