import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  ConfettiEffect,
  FireworksEffect,
  XPFloatEffect,
  StreakFlameEffect,
} from "@/components/ui/XPEffects";
import { useMicroInteractions } from "@/hooks/useMicroInteractions";

interface EffectsContextType {
  celebrate: () => void;
  showLevelUp: () => void;
  showXPGain: (amount: number) => void;
  showStreak: (days: number) => void;
}

const EffectsContext = createContext<EffectsContextType | null>(null);

export function useEffects() {
  const context = useContext(EffectsContext);
  if (!context) {
    return {
      celebrate: () => {},
      showLevelUp: () => {},
      showXPGain: () => {},
      showStreak: () => {},
    };
  }
  return context;
}

interface EffectsProviderProps {
  children: ReactNode;
}

export function EffectsProvider({ children }: EffectsProviderProps) {
  const {
    celebrate,
    levelUp,
    xpGain,
    streak,
    activeEffects,
    trigger,
    cancelAll,
  } = useMicroInteractions();

  const [confettiActive, setConfettiActive] = useState(false);
  const [fireworksActive, setFireworksActive] = useState(false);
  const [xpFloatActive, setXPFLoatActive] = useState(false);
  const [streakActive, setStreakActive] = useState(false);
  const [xpAmount, setXpAmount] = useState(100);
  const [streakDays, setStreakDays] = useState(7);

  const showCelebrate = useCallback(() => {
    setConfettiActive(true);
  }, []);

  const showLevelUp = useCallback(() => {
    setFireworksActive(true);
  }, []);

  const showXPGain = useCallback((amount: number) => {
    setXpAmount(amount);
    setXPFLoatActive(true);
  }, []);

  const showStreak = useCallback((days: number) => {
    setStreakDays(days);
    setStreakActive(true);
  }, []);

  return (
    <EffectsContext.Provider
      value={{
        celebrate: showCelebrate,
        showLevelUp,
        showXPGain,
        showStreak,
      }}
    >
      {children}

      {/* Confetti Effect */}
      <ConfettiEffect
        active={confettiActive}
        particleCount={120}
        onComplete={() => setConfettiActive(false)}
      />

      {/* Fireworks Effect */}
      <FireworksEffect
        active={fireworksActive}
        onComplete={() => setFireworksActive(false)}
      />

      {/* XP Float Effect */}
      <XPFloatEffect
        active={xpFloatActive}
        amount={xpAmount}
        onComplete={() => setXPFLoatActive(false)}
      />

      {/* Streak Flame Effect */}
      <StreakFlameEffect
        active={streakActive}
        days={streakDays}
        onComplete={() => setStreakActive(false)}
      />
    </EffectsContext.Provider>
  );
}
