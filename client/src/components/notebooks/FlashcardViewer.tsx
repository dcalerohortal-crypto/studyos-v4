import { useState, useCallback } from "react";
import { Flashcard } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Lightbulb,
  Plus,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MathRenderer from "./MathRenderer";

interface FlashcardViewerProps {
  title: string;
  flashcards: Flashcard[];
  onComplete?: () => void;
  onAddToSRS?: () => void;
}

export default function FlashcardViewer({
  title,
  flashcards,
  onComplete,
  onAddToSRS,
}: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studied, setStudied] = useState<Set<number>>(new Set());

  const current = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  const allStudied = studied.size === flashcards.length;

  const handleFlip = useCallback(() => {
    setFlipped(prev => !prev);
  }, []);

  const handleMarkStudied = useCallback(() => {
    setStudied(prev => new Set([...prev, currentIndex]));
    setFlipped(false);

    if (currentIndex < flashcards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
    } else {
      onComplete?.();
    }
  }, [currentIndex, flashcards.length, onComplete]);

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
    }
  }, [currentIndex, flashcards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
              FLASHCARDS
            </span>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {flashcards.length}
            </span>
          </div>
          <button
            onClick={onAddToSRS}
            className="flex items-center gap-1 px-3 py-1 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir al SRS
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      </div>

      {/* Flip Card */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <div
          className="flip-card w-full max-w-2xl h-80 cursor-pointer"
          onClick={handleFlip}
        >
          <motion.div
            className={`flip-card-inner ${flipped ? "flipped" : ""}`}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.3, 1] }}
          >
            {/* Front - Question */}
            <div className="flip-card-front">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-400">?</span>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <span className="text-xs text-purple-400/60 font-medium">
                  PREGUNTA
                </span>
              </div>
              <div className="flex items-center justify-center h-full px-8">
                <div className="text-xl font-semibold text-foreground text-center leading-relaxed">
                  <MathRenderer content={current.front} />
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-xs text-muted-foreground">
                  Toca para ver la respuesta
                </span>
              </div>
            </div>

            {/* Back - Answer */}
            <div className="flip-card-back">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <span className="text-xs text-amber-400/60 font-medium">
                  RESPUESTA
                </span>
              </div>
              <div className="flex items-center justify-center h-full px-8">
                <div className="text-xl font-semibold text-foreground text-center leading-relaxed overflow-auto">
                  <MathRenderer content={current.back} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Mark as studied button */}
        <AnimatePresence>
          {flipped && !studied.has(currentIndex) && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={handleMarkStudied}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-5 h-5" />
              {currentIndex === flashcards.length - 1
                ? "Terminar"
                : "Marcar como estudiada"}
            </motion.button>
          )}
        </AnimatePresence>

        {studied.has(currentIndex) && (
          <div className="flex items-center justify-center gap-2 py-2 text-emerald-400">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Estudiada</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 disabled:opacity-30 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          {/* Indicators */}
          <div className="flex gap-1">
            {flashcards
              .slice(Math.max(0, currentIndex - 2), currentIndex + 3)
              .map((_, idx) => {
                const actualIdx = Math.max(0, currentIndex - 2) + idx;
                const isActive = actualIdx === currentIndex;
                const isStudied = studied.has(actualIdx);

                return (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isActive
                        ? "w-6 bg-purple-500"
                        : isStudied
                          ? "bg-emerald-500"
                          : "bg-secondary"
                    }`}
                  />
                );
              })}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 disabled:opacity-30 rounded-lg transition-colors"
          >
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        .flip-card {
          perspective: 1000px;
        }
        
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        
        .flip-card-front,
        .flip-card-back {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 1.25rem;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .flip-card-front {
          background: linear-gradient(145deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.1));
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow: 
            0 4px 24px rgba(139, 92, 246, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }
        
        .flip-card-back {
          background: linear-gradient(145deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1));
          border: 1px solid rgba(251, 191, 36, 0.3);
          transform: rotateY(180deg);
          box-shadow: 
            0 4px 24px rgba(251, 191, 36, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }
        
        .flip-card:hover .flip-card-front {
          box-shadow: 
            0 8px 32px rgba(139, 92, 246, 0.2),
            0 0 0 1px rgba(139, 92, 246, 0.4) inset;
        }
        
        .flip-card:hover .flip-card-back {
          box-shadow: 
            0 8px 32px rgba(251, 191, 36, 0.2),
            0 0 0 1px rgba(251, 191, 36, 0.4) inset;
        }
      `}</style>
    </div>
  );
}
