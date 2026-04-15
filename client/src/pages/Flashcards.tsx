import { useState, useMemo } from "react";
import { useFlashcards, SRSQuality } from "@/hooks/useFlashcards";
import { useGameState } from "@/hooks/useGameState";
import { SUBJECTS } from "@/../../shared/const";
import { FlashcardDeck, Flashcard } from "@/types";
import {
  Plus,
  Trash2,
  BookOpen,
  Brain,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Target,
  ArrowLeft,
} from "lucide-react";

type ViewMode = "list" | "study" | "create" | "createCards";

interface StudyCard extends Flashcard {
  deckId: string;
  deckName: string;
}

export default function Flashcards() {
  const {
    decks,
    createDeck,
    addCardToDeck,
    addCardsToDeck,
    deleteDeck,
    deleteCard,
    reviewCard,
    getDeck,
    stats,
    getCardsForToday,
  } = useFlashcards();
  const { addXP } = useGameState();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("matematicas");
  const [showNewDeckDialog, setShowNewDeckDialog] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");

  // Study mode state
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studySessionXp, setStudySessionXp] = useState(0);

  // Create cards state
  const [newCards, setNewCards] = useState<
    { question: string; answer: string }[]
  >([{ question: "", answer: "" }]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const currentDeck = selectedDeckId ? getDeck(selectedDeckId) : null;
  const cardsForToday = useMemo(
    () => getCardsForToday(selectedDeckId || undefined),
    [getCardsForToday, selectedDeckId]
  );
  const currentCard = studyCards[currentCardIndex];

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    const deck = createDeck(newDeckName, selectedSubject, newDeckDescription);
    setSelectedDeckId(deck.id);
    setNewDeckName("");
    setNewDeckDescription("");
    setShowNewDeckDialog(false);
    setViewMode("list");
  };

  const handleStartStudy = (deckId?: string) => {
    const cards = getCardsForToday(deckId || selectedDeckId || undefined);
    if (cards.length === 0) return;
    setStudyCards(cards);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setStudySessionXp(0);
    setViewMode("study");
  };

  const handleReview = (quality: SRSQuality) => {
    if (!currentCard) return;
    const xp = reviewCard(currentCard.deckId, currentCard.id, quality);
    setStudySessionXp(prev => prev + xp);
    addXP(xp, currentCard.subjectId, `Flashcard revisada`);

    setShowAnswer(false);
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Sesión completa
      if (studySessionXp + xp >= stats.dueToday * 5) {
        addXP(25, "", "Deck completado");
      }
      setViewMode("list");
    }
  };

  const handleAddCard = () => {
    if (!selectedDeckId) return;
    const lastCard = newCards[newCards.length - 1];
    if (!lastCard.question.trim() || !lastCard.answer.trim()) return;

    addCardToDeck(
      selectedDeckId,
      lastCard.question,
      lastCard.answer,
      selectedSubject
    );
    setNewCards([{ question: "", answer: "" }]);
  };

  const handleBulkImport = () => {
    if (!selectedDeckId || !bulkText.trim()) return;

    const lines = bulkText.split("\n").filter(l => l.trim());
    const cards: { question: string; answer: string }[] = [];

    for (const line of lines) {
      // Formato: pregunta | respuesta
      const parts = line.split("|").map(p => p.trim());
      if (parts.length >= 2) {
        cards.push({ question: parts[0], answer: parts[1] });
      }
    }

    if (cards.length > 0) {
      addCardsToDeck(selectedDeckId, cards);
      setBulkText("");
      setViewMode("list");
    }
  };

  const renderStars = (quality: SRSQuality) => {
    const labels = [
      "Otra vez",
      "Difícil",
      "Bien",
      "Fácil",
      "Muy fácil",
      "Perfecto",
    ];
    const colors = [
      "text-red-500",
      "text-orange-500",
      "text-yellow-500",
      "text-green-400",
      "text-green-500",
      "text-emerald-500",
    ];
    return { label: labels[quality], color: colors[quality] };
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      {viewMode === "list" && (
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Brain className="w-10 h-10 text-accent" />
            Flashcards
          </h1>
          <p className="text-muted-foreground">
            Repetición espaciada para memorizar
          </p>
        </div>
      )}

      {/* Stats Bar */}
      {viewMode === "list" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-accent mb-1">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium">Pendientes hoy</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.dueToday}
            </p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Dominadas</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.mastered}
            </p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-orange-500 mb-1">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-medium">Aprendiendo</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.learning}
            </p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Precisión</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.accuracy}%
            </p>
          </div>
        </div>
      )}

      {/* Study Mode */}
      {viewMode === "study" && currentCard && (
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Salir
            </button>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {currentCardIndex + 1} / {studyCards.length}
              </span>
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{
                    width: `${((currentCardIndex + 1) / studyCards.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-accent">
              <Zap className="w-5 h-5" />
              <span>+{studySessionXp} XP</span>
            </div>
          </div>

          {/* Card */}
          <div className="glass-card p-8 min-h-[300px] flex flex-col">
            <div className="text-sm text-muted-foreground mb-4">
              {currentCard.deckName}
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center">
              {!showAnswer ? (
                <p className="text-2xl font-medium text-foreground text-center">
                  {currentCard.question}
                </p>
              ) : (
                <div className="text-center">
                  <p className="text-xl text-muted-foreground mb-4">
                    {currentCard.question}
                  </p>
                  <p className="text-2xl font-bold text-accent">
                    {currentCard.answer}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8">
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-4 font-semibold text-lg transition-all"
                >
                  Mostrar respuesta
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-muted-foreground mb-2">
                    ¿Qué tal lo recordaste?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([0, 3, 5] as SRSQuality[]).map(q => {
                      const { label, color } = renderStars(q);
                      return (
                        <button
                          key={q}
                          onClick={() => handleReview(q)}
                          className={`bg-secondary hover:bg-secondary/80 ${color} rounded-lg py-3 font-semibold transition-all`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {([1, 2, 4] as SRSQuality[]).map(q => {
                      const { label, color } = renderStars(q);
                      return (
                        <button
                          key={q}
                          onClick={() => handleReview(q)}
                          className={`bg-secondary hover:bg-secondary/80 ${color} rounded-lg py-2 font-medium transition-all text-sm`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {/* Subject Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedSubject("")}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedSubject === ""
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              Todas
            </button>
            {SUBJECTS.map(subject => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  selectedSubject === subject.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {subject.nombre}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                setSelectedDeckId(null);
                setShowNewDeckDialog(true);
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-6 py-3 font-semibold flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              Nuevo Deck
            </button>
            {cardsForToday.length > 0 && (
              <button
                onClick={() => handleStartStudy()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-6 py-3 font-semibold flex items-center gap-2 transition-all"
              >
                <Brain className="w-5 h-5" />
                Estudiar ({cardsForToday.length})
              </button>
            )}
          </div>

          {/* Decks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks
              .filter(d => !selectedSubject || d.subjectId === selectedSubject)
              .map(deck => {
                const dueCards = deck.cards.filter(
                  c =>
                    c.nextReviewDate <= new Date().toISOString().split("T")[0]
                ).length;
                const masteredCards = deck.cards.filter(
                  c => c.interval >= 21
                ).length;
                const subject = SUBJECTS.find(s => s.id === deck.subjectId);

                return (
                  <div key={deck.id} className="glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {deck.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {subject?.nombre}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm("¿Eliminar este deck?")) {
                            deleteDeck(deck.id);
                          }
                        }}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">
                          {deck.cards.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">
                          {dueCards}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pendientes
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-500">
                          {masteredCards}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dominadas
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDeckId(deck.id);
                          setViewMode("createCards");
                        }}
                        className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg py-2 font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Añadir
                      </button>
                      {dueCards > 0 && (
                        <button
                          onClick={() => {
                            setSelectedDeckId(deck.id);
                            handleStartStudy(deck.id);
                          }}
                          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-2 font-medium transition-all"
                        >
                          Estudiar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {decks.filter(
              d => !selectedSubject || d.subjectId === selectedSubject
            ).length === 0 && (
              <div className="col-span-full glass-card p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay decks de flashcards
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Crea uno para empezar a estudiar
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Cards View */}
      {viewMode === "createCards" && currentDeck && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <h2 className="text-xl font-bold">{currentDeck.name}</h2>
            <div className="w-20" />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setBulkMode(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !bulkMode
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              Una por una
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                bulkMode
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              Importar en masa
            </button>
          </div>

          {!bulkMode ? (
            /* Individual Cards */
            <div className="space-y-4">
              {newCards.map((card, index) => (
                <div key={index} className="glass-card p-4 space-y-3">
                  <input
                    type="text"
                    value={card.question}
                    onChange={e => {
                      const updated = [...newCards];
                      updated[index].question = e.target.value;
                      setNewCards(updated);
                    }}
                    placeholder="Pregunta"
                    className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="text"
                    value={card.answer}
                    onChange={e => {
                      const updated = [...newCards];
                      updated[index].answer = e.target.value;
                      setNewCards(updated);
                    }}
                    placeholder="Respuesta"
                    className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              ))}

              <button
                onClick={() =>
                  setNewCards([...newCards, { question: "", answer: "" }])
                }
                className="w-full border-2 border-dashed border-border rounded-lg py-4 text-muted-foreground hover:text-foreground hover:border-accent transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Añadir otra
              </button>

              <button
                onClick={handleAddCard}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-4 font-semibold transition-all"
              >
                Guardar ({newCards.filter(c => c.question && c.answer).length}{" "}
                tarjetas)
              </button>
            </div>
          ) : (
            /* Bulk Import */
            <div className="glass-card p-6">
              <p className="text-muted-foreground mb-4">
                Escribe una flashcard por línea con el formato:{" "}
                <code className="bg-secondary px-2 py-1 rounded">
                  pregunta | respuesta
                </code>
              </p>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={`¿Qué es la fotosíntesis? | Proceso por el cual las plantas convierten luz en energía
¿Qué es el ADN? | Molécula que contiene la información genética
¿Primera ley de Newton? | Un cuerpo permanece en reposo o movimiento uniforme si no actúa fuerza externa`}
                className="w-full h-64 bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
              />
              <button
                onClick={handleBulkImport}
                className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-4 font-semibold transition-all"
              >
                Importar tarjetas
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Deck Dialog */}
      {showNewDeckDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Nuevo Deck de Flashcards
            </h2>

            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-2">
                Nombre del deck
              </label>
              <input
                type="text"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                placeholder="Ej: Física - Tema 1"
                className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-2">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={newDeckDescription}
                onChange={e => setNewDeckDescription(e.target.value)}
                placeholder="Ej: Leyes de Newton"
                className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-muted-foreground mb-2">
                Asignatura
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedSubject === subject.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {subject.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateDeck}
                disabled={!newDeckName.trim()}
                className="flex-1 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-accent-foreground rounded-lg px-4 py-3 font-semibold transition-all"
              >
                Crear Deck
              </button>
              <button
                onClick={() => setShowNewDeckDialog(false)}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg px-4 py-3 font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
