import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Eye,
  Lightbulb,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  X,
} from "lucide-react";
import {
  useThinkingChain,
  ThoughtStep,
  ThinkingChain,
} from "@/hooks/useThinkingChain";

interface StepIconProps {
  type: ThoughtStep["type"];
  isComplete: boolean;
}

const StepIcon = ({ type, isComplete }: StepIconProps) => {
  const icons = {
    observation: Eye,
    reasoning: Brain,
    conclusion: Lightbulb,
    action: Target,
    reflection: Zap,
  };
  const Icon = icons[type];

  return isComplete ? (
    <CheckCircle2 className="w-4 h-4 text-green-500" />
  ) : (
    <Loader2 className="w-4 h-4 text-accent animate-spin" />
  );
};

interface StepLineProps {
  step: ThoughtStep;
  onToggle: () => void;
  showTokens: boolean;
}

const StepLine = ({ step, onToggle, showTokens }: StepLineProps) => {
  const colors = {
    observation: "border-blue-500/30 bg-blue-500/5",
    reasoning: "border-purple-500/30 bg-purple-500/5",
    conclusion: "border-green-500/30 bg-green-500/5",
    action: "border-orange-500/30 bg-orange-500/5",
    reflection: "border-yellow-500/30 bg-yellow-500/5",
  };

  const labels = {
    observation: "📍 Observación",
    reasoning: "🧠 Razonamiento",
    conclusion: "💡 Conclusión",
    action: "⚡ Acción",
    reflection: "🔄 Reflexión",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`border-l-2 ${colors[step.type]} rounded-r-lg mb-2 overflow-hidden`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-2 p-2 text-left hover:bg-white/5 transition-colors"
      >
        <StepIcon type={step.type} isComplete={step.isComplete} />
        <span className="text-xs text-muted-foreground mt-0.5">
          {labels[step.type]}
        </span>
        <span className="text-xs text-muted-foreground/50 ml-auto flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {step.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {showTokens && (
          <span className="text-xs text-muted-foreground/50">
            {step.tokens}t
          </span>
        )}
        {step.isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
        )}
      </button>

      <AnimatePresence>
        {step.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-3"
          >
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
              {step.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface ThinkingConsoleProps {
  chain?: ThinkingChain;
  showTokens?: boolean;
  maxHeight?: string;
  onCancel?: () => void;
}

export default function ThinkingConsole({
  chain,
  showTokens = true,
  maxHeight = "400px",
  onCancel,
}: ThinkingConsoleProps) {
  const { activeChain, isThinking, toggleStepExpansion } = useThinkingChain();

  const displayChain = chain || activeChain;

  useEffect(() => {
    if (displayChain && isThinking) {
      const lastStep = displayChain.steps[displayChain.steps.length - 1];
      if (lastStep && !lastStep.isComplete) {
        toggleStepExpansion(lastStep.id);
      }
    }
  }, [displayChain?.steps.length, isThinking]);

  if (!displayChain) return null;

  const statusColors = {
    thinking: "text-accent",
    completed: "text-green-500",
    paused: "text-yellow-500",
    error: "text-red-500",
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isThinking ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          ) : (
            <Brain className={`w-4 h-4 ${statusColors[displayChain.status]}`} />
          )}
          <span className="text-sm font-medium text-foreground">
            Thinking Chain
          </span>
          {showTokens && (
            <span className="text-xs text-muted-foreground ml-2">
              {displayChain.totalTokens}t
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${statusColors[displayChain.status]}`}>
            {displayChain.steps.length} pasos
          </span>
          {onCancel && !isThinking && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-secondary rounded"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="p-3 border-b border-border bg-secondary/30">
        <p className="text-xs text-muted-foreground mb-1">Pregunta:</p>
        <p className="text-sm text-foreground line-clamp-2">
          {displayChain.question}
        </p>
      </div>

      {/* Steps */}
      <div className="overflow-y-auto p-3 space-y-1" style={{ maxHeight }}>
        <AnimatePresence>
          {displayChain.steps.map((step, idx) => (
            <StepLine
              key={step.id}
              step={step}
              onToggle={() => toggleStepExpansion(step.id)}
              showTokens={showTokens}
            />
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-muted-foreground py-2"
          >
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span>Pensando...</span>
          </motion.div>
        )}
      </div>

      {/* Final Answer */}
      {displayChain.finalAnswer && (
        <div className="p-3 border-t border-border bg-green-500/5">
          <p className="text-xs text-green-500 mb-1">Respuesta final:</p>
          <p className="text-sm text-foreground">{displayChain.finalAnswer}</p>
        </div>
      )}

      {/* Duration */}
      {displayChain.completedAt && (
        <div className="p-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            Tiempo:{" "}
            {Math.round(
              (displayChain.completedAt.getTime() -
                displayChain.startedAt.getTime()) /
                1000
            )}
            s
          </span>
          <span className="ml-auto">{displayChain.totalTokens} tokens</span>
        </div>
      )}
    </div>
  );
}
