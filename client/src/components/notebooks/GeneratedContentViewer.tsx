import { GeneratedContent, Flashcard, TestQuestion } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Brain,
  Lightbulb,
  Check,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useFlashcards } from "@/hooks/useFlashcards";

interface Props {
  content: GeneratedContent;
  notebookId?: string;
  subjectId?: string;
}

export default function GeneratedContentViewer({
  content,
  notebookId,
  subjectId,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const { addCardsToDeck, decks, createDeck } = useFlashcards();
  const [addingToSRS, setAddingToSRS] = useState(false);
  const [addedToSRS, setAddedToSRS] = useState(false);

  const handleAddToSRS = useCallback(async () => {
    if (content.type !== "flashcards") return;

    setAddingToSRS(true);

    try {
      const flashcards: Flashcard[] = content.content;

      // Buscar deck existente o crear nuevo
      const deckName = content.title.replace("Flashcards: ", "");
      let targetDeck = decks.find(d => d.name === deckName);

      if (!targetDeck) {
        targetDeck = createDeck(
          deckName,
          subjectId || "matematicas",
          `Deck de ${deckName}`
        );
      }

      // Convertir flashcards generadas al formato SRS
      const srsCards = flashcards.map(fc => ({
        question: fc.question,
        answer: fc.answer,
      }));

      addCardsToDeck(targetDeck.id, srsCards);
      setAddedToSRS(true);

      // Resetear después de 2 segundos
      setTimeout(() => setAddedToSRS(false), 2000);
    } catch (error) {
      console.error("Error adding to SRS:", error);
    } finally {
      setAddingToSRS(false);
    }
  }, [content, decks, createDeck, addCardsToDeck, subjectId]);

  if (content.type === "flashcards") {
    const flashcards: Flashcard[] = content.content;
    const current = flashcards[currentIndex];
    const progress = ((currentIndex + 1) / flashcards.length) * 100;

    return (
      <div className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {content.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {flashcards.length} tarjetas
              </p>
            </div>
          </div>

          {/* Add to SRS Button */}
          <button
            onClick={handleAddToSRS}
            disabled={addingToSRS || addedToSRS}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              addedToSRS
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-accent/20 hover:bg-accent/30 text-accent"
            }`}
          >
            {addingToSRS ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : addedToSRS ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {addedToSRS ? "Añadido" : "Añadir al SRS"}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progreso</span>
            <span>
              {currentIndex + 1} / {flashcards.length}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 3D Flip Card */}
        <div className="flex-1 flex items-center justify-center mb-4">
          <div
            className="flip-card w-full max-w-md h-64 cursor-pointer"
            onClick={() => setFlipped(!flipped)}
          >
            <div className={`flip-card-inner ${flipped ? "flipped" : ""}`}>
              {/* Front - Question */}
              <div className="flip-card-front">
                <div className="absolute top-4 left-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold text-purple-400">?</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="text-xs text-purple-400/60 font-medium">
                    PREGUNTA
                  </span>
                </div>
                <div className="flex items-center justify-center h-full px-8">
                  <p className="text-xl md:text-2xl font-semibold text-foreground text-center leading-relaxed">
                    {current.question}
                  </p>
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
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="text-xs text-amber-400/60 font-medium">
                    RESPUESTA
                  </span>
                </div>
                <div className="flex items-center justify-center h-full px-8">
                  <p className="text-xl md:text-2xl font-semibold text-foreground text-center leading-relaxed">
                    {current.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentIndex(Math.max(0, currentIndex - 1));
              setFlipped(false);
            }}
            disabled={currentIndex === 0}
            className="p-2.5 bg-secondary hover:bg-secondary/80 disabled:opacity-30 rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Card indicators */}
          <div className="flex gap-1">
            {flashcards
              .slice(Math.max(0, currentIndex - 2), currentIndex + 3)
              .map((_, idx) => {
                const actualIdx = Math.max(0, currentIndex - 2) + idx;
                const isActive = actualIdx === currentIndex;
                return (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isActive ? "w-6 bg-purple-500" : "bg-secondary"
                    }`}
                  />
                );
              })}
          </div>

          <button
            onClick={() => {
              setCurrentIndex(
                Math.min(flashcards.length - 1, currentIndex + 1)
              );
              setFlipped(false);
            }}
            disabled={currentIndex === flashcards.length - 1}
            className="p-2.5 bg-secondary hover:bg-secondary/80 disabled:opacity-30 rounded-xl transition-all"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* SRS hint */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Añade estas tarjetas al SRS para estudiarlas con repetición espaciada
        </p>

        <style>{`
          .flip-card {
            perspective: 1000px;
          }
          
          .flip-card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.3, 1);
          }
          
          .flip-card-inner.flipped {
            transform: rotateY(180deg);
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
          
          .flip-card:hover .flip-card-inner {
            transform: ${flipped ? "rotateY(180deg)" : "translateY(-4px)"};
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

  if (content.type === "test") {
    const questions: TestQuestion[] = content.content;
    const current = questions[currentIndex];
    const userAnswer = selectedAnswers[currentIndex];
    const answeredCount = Object.keys(selectedAnswers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-red-400">?</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {content.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {questions.length} preguntas
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Respondidas</span>
            <span>
              {answeredCount} / {questions.length}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Pregunta {currentIndex + 1}
          </p>
          <h4 className="text-lg font-semibold text-foreground mb-4">
            {current.question}
          </h4>

          <div className="space-y-2">
            {current.options.map((option, idx) => {
              const isCorrect = idx === current.correctAnswer;
              const isSelected = userAnswer === idx;

              return (
                <button
                  key={idx}
                  onClick={() =>
                    setSelectedAnswers({
                      ...selectedAnswers,
                      [currentIndex]: idx,
                    })
                  }
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isSelected && isCorrect
                      ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400"
                      : isSelected && !isCorrect
                        ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                        : "bg-secondary hover:bg-secondary/80 text-foreground border-2 border-transparent"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected && isCorrect
                        ? "bg-emerald-500 text-white"
                        : isSelected && !isCorrect
                          ? "bg-red-500 text-white"
                          : "bg-secondary-foreground/10"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {isSelected && isCorrect && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  {isSelected && !isCorrect && (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </button>
              );
            })}
          </div>

          {userAnswer !== undefined && current.explanation && (
            <div className="mt-4 p-3 bg-accent/10 rounded-xl border border-accent/20">
              <p className="text-sm text-foreground">{current.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="p-2.5 bg-secondary hover:bg-secondary/80 disabled:opacity-30 rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSelectedAnswers({})}
            className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-xl transition-all"
            title="Reiniciar respuestas"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))
            }
            disabled={currentIndex === questions.length - 1}
            className="p-2.5 bg-secondary hover:bg-secondary/80 disabled:opacity-30 rounded-xl transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (content.type === "summary") {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-blue-400">📝</span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {content.title}
          </h3>
        </div>
        <div className="prose prose-invert max-w-none">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {content.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {content.title}
      </h3>
      <p className="text-muted-foreground">Contenido de tipo {content.type}</p>
    </div>
  );
}
