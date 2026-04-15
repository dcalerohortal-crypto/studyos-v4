import { useState, useCallback, useRef } from "react";

export interface ThoughtStep {
  id: string;
  step: number;
  type: "observation" | "reasoning" | "conclusion" | "action" | "reflection";
  content: string;
  timestamp: Date;
  isComplete: boolean;
  isExpanded: boolean;
  tokens: number;
}

export interface ThinkingChain {
  id: string;
  question: string;
  steps: ThoughtStep[];
  finalAnswer?: string;
  startedAt: Date;
  completedAt?: Date;
  totalTokens: number;
  status: "thinking" | "completed" | "paused" | "error";
}

export interface ThinkingOptions {
  maxSteps?: number;
  showTokens?: boolean;
  autoExpand?: boolean;
  streamInterval?: number;
}

const DEFAULT_OPTIONS: Required<ThinkingOptions> = {
  maxSteps: 20,
  showTokens: true,
  autoExpand: true,
  streamInterval: 50,
};

export function useThinkingChain(options: ThinkingOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [chains, setChains] = useState<ThinkingChain[]>([]);
  const [activeChain, setActiveChain] = useState<ThinkingChain | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate unique ID
  const generateId = () =>
    `chain_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Create new thinking chain
  const startThinking = useCallback((question: string) => {
    const newChain: ThinkingChain = {
      id: generateId(),
      question,
      steps: [],
      startedAt: new Date(),
      totalTokens: 0,
      status: "thinking",
    };
    setChains(prev => [...prev, newChain]);
    setActiveChain(newChain);
    setIsThinking(true);
    return newChain;
  }, []);

  // Add step to current chain
  const addStep = useCallback(
    (type: ThoughtStep["type"], content: string, tokens: number = 0) => {
      if (!activeChain) return;

      const newStep: ThoughtStep = {
        id: `step_${Date.now()}`,
        step: activeChain.steps.length + 1,
        type,
        content,
        timestamp: new Date(),
        isComplete: false,
        isExpanded: opts.autoExpand,
        tokens,
      };

      setActiveChain(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: [...prev.steps, newStep],
          totalTokens: prev.totalTokens + tokens,
        };
      });

      setChains(prev =>
        prev.map(chain =>
          chain.id === activeChain.id
            ? { ...chain, steps: [...chain.steps, newStep] }
            : chain
        )
      );
    },
    [activeChain, opts.autoExpand]
  );

  // Update step content (for streaming)
  const updateStep = useCallback(
    (stepId: string, content: string, isComplete?: boolean) => {
      if (!activeChain) return;

      setActiveChain(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map(step =>
            step.id === stepId
              ? { ...step, content, isComplete: isComplete ?? step.isComplete }
              : step
          ),
        };
      });

      setChains(prev =>
        prev.map(chain =>
          chain.id === activeChain.id
            ? {
                ...chain,
                steps: chain.steps.map(step =>
                  step.id === stepId
                    ? {
                        ...step,
                        content,
                        isComplete: isComplete ?? step.isComplete,
                      }
                    : step
                ),
              }
            : chain
        )
      );
    },
    [activeChain]
  );

  // Mark step complete
  const completeStep = useCallback(
    (stepId: string) => {
      if (!activeChain) return;

      setActiveChain(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map(step =>
            step.id === stepId ? { ...step, isComplete: true } : step
          ),
        };
      });
    },
    [activeChain]
  );

  // Toggle step expansion
  const toggleStepExpansion = useCallback(
    (stepId: string) => {
      if (!activeChain) return;

      setActiveChain(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map(step =>
            step.id === stepId
              ? { ...step, isExpanded: !step.isExpanded }
              : step
          ),
        };
      });
    },
    [activeChain]
  );

  // Complete thinking chain with final answer
  const finishThinking = useCallback(
    (finalAnswer: string) => {
      if (!activeChain) return;

      setActiveChain(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          finalAnswer,
          status: "completed",
          completedAt: new Date(),
        };
      });
      setIsThinking(false);
    },
    [activeChain]
  );

  // Pause thinking
  const pauseThinking = useCallback(() => {
    if (!activeChain) return;

    setActiveChain(prev => {
      if (!prev) return prev;
      return { ...prev, status: "paused" };
    });
    setIsThinking(false);
  }, [activeChain]);

  // Resume thinking
  const resumeThinking = useCallback(() => {
    if (!activeChain) return;

    setActiveChain(prev => {
      if (!prev) return prev;
      return { ...prev, status: "thinking" };
    });
    setIsThinking(true);
  }, [activeChain]);

  // Cancel thinking
  const cancelThinking = useCallback(() => {
    if (!activeChain) return;

    setActiveChain(prev => {
      if (!prev) return prev;
      return { ...prev, status: "error" };
    });
    setIsThinking(false);
  }, [activeChain]);

  // Clear inactive chains (keep only last 5)
  const clearOldChains = useCallback(() => {
    setChains(prev => prev.slice(-5));
  }, []);

  // Get step summary
  const getStepSummary = useCallback(
    (chainId: string) => {
      const chain = chains.find(c => c.id === chainId);
      if (!chain) return null;

      return {
        observations: chain.steps.filter(s => s.type === "observation").length,
        reasoning: chain.steps.filter(s => s.type === "reasoning").length,
        conclusions: chain.steps.filter(s => s.type === "conclusion").length,
        actions: chain.steps.filter(s => s.type === "action").length,
        reflections: chain.steps.filter(s => s.type === "reflection").length,
        totalSteps: chain.steps.length,
        totalTokens: chain.totalTokens,
      };
    },
    [chains]
  );

  return {
    chains,
    activeChain,
    isThinking,
    startThinking,
    addStep,
    updateStep,
    completeStep,
    toggleStepExpansion,
    finishThinking,
    pauseThinking,
    resumeThinking,
    cancelThinking,
    clearOldChains,
    getStepSummary,
  };
}
