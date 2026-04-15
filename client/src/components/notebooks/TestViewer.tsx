import { useState, useCallback } from "react";
import { TestQuestion } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Lightbulb,
  Trophy,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MathRenderer from "./MathRenderer";

interface TestViewerProps {
  title: string;
  questions: TestQuestion[];
  onAnswerCorrect: () => void;
  onComplete: (correct: number, total: number) => void;
  onXPChange?: (xp: number) => void;
}

export default function TestViewer({
  title,
  questions,
  onAnswerCorrect,
  onComplete,
  onXPChange,
}: TestViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const current = questions[currentIndex];
  const isCorrect = selectedAnswer === current.correctAnswer;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (showFeedback) return;

      setSelectedAnswer(answerIndex);
      setShowFeedback(true);

      if (answerIndex === current.correctAnswer) {
        setCorrectCount(prev => prev + 1);
        setXpGained(prev => prev + 5);
        onAnswerCorrect();
        onXPChange?.(xpGained + 5);
      }
    },
    [showFeedback, current.correctAnswer, onAnswerCorrect, onXPChange, xpGained]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Test completado
      setShowComplete(true);
      onComplete(correctCount + (isCorrect ? 1 : 0), questions.length);
    }
  }, [currentIndex, questions.length, correctCount, isCorrect, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentIndex]);

  if (showComplete) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    const stars = percentage >= 80 ? 3 : percentage >= 50 ? 2 : 1;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center p-8"
      >
        <div className="text-6xl mb-4">
          {percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "💪"}
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          ¡Test Completado!
        </h2>

        <div className="flex gap-1 mb-4">
          {[1, 2, 3].map(i => (
            <span
              key={i}
              className={`text-3xl ${i <= stars ? "" : "opacity-30"}`}
            >
              ⭐
            </span>
          ))}
        </div>

        <p className="text-4xl font-bold text-accent mb-2">
          {correctCount} / {questions.length}
        </p>
        <p className="text-muted-foreground mb-6">{percentage}% de aciertos</p>

        <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full mb-6">
          <Trophy className="w-5 h-5 text-accent" />
          <span className="font-bold text-accent">+{xpGained + 20} XP</span>
        </div>

        <button
          onClick={() => setShowComplete(false)}
          className="px-6 py-3 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg font-semibold transition-colors"
        >
          Volver al test
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
              TEST
            </span>
            <span className="text-sm text-muted-foreground">
              Pregunta {currentIndex + 1} de {questions.length}
            </span>
          </div>
          <div className="flex items-center gap-1 text-accent">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold">+5 XP por respuesta</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-6 mb-6"
          >
            <h3 className="text-xl font-semibold text-foreground mb-6">
              <MathRenderer content={current.question} />
            </h3>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3">
              {current.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedAnswer === idx;
                const isCorrectAnswer = idx === current.correctAnswer;

                let bgColor = "bg-secondary hover:bg-secondary/80";
                let borderColor = "border-transparent";
                let textColor = "text-foreground";
                let icon = null;

                if (showFeedback) {
                  if (isCorrectAnswer) {
                    bgColor = "bg-emerald-500/20";
                    borderColor = "border-emerald-500";
                    textColor = "text-emerald-400";
                    icon = <Check className="w-5 h-5 text-emerald-400" />;
                  } else if (isSelected && !isCorrectAnswer) {
                    bgColor = "bg-red-500/20";
                    borderColor = "border-red-500";
                    textColor = "text-red-400";
                    icon = <X className="w-5 h-5 text-red-400" />;
                  }
                } else if (isSelected) {
                  bgColor = "bg-accent/20";
                  borderColor = "border-accent";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={showFeedback}
                    className={`p-4 rounded-xl text-left transition-all border-2 ${bgColor} ${borderColor} ${textColor} disabled:cursor-default`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          showFeedback && isCorrectAnswer
                            ? "bg-emerald-500 text-white"
                            : showFeedback && isSelected && !isCorrectAnswer
                              ? "bg-red-500 text-white"
                              : "bg-secondary-foreground/10"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1">
                        <MathRenderer content={option} />
                      </span>
                      {icon}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback / Explanation */}
            <AnimatePresence>
              {showFeedback && current.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-4 p-4 rounded-xl ${
                    isCorrect ? "bg-emerald-500/10" : "bg-amber-500/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb
                      className={`w-5 h-5 ${isCorrect ? "text-emerald-400" : "text-amber-400"}`}
                    />
                    <span
                      className={`font-semibold ${isCorrect ? "text-emerald-400" : "text-amber-400"}`}
                    >
                      {isCorrect ? "¡Correcto!" : "Explicación"}
                    </span>
                  </div>
                  <div className="text-sm text-foreground">
                    <MathRenderer content={current.explanation || ""} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-auto">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 disabled:opacity-30 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg font-semibold transition-colors"
          >
            {currentIndex === questions.length - 1 ? "Finalizar" : "Siguiente"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
