import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { Flashcard, FlashcardDeck } from "@/types";

// XP rewards
const XP_REWARDS = {
  CARD_REVIEWED: 5,
  DECK_COMPLETED: 25,
  STREAK_BONUS: 10,
};

export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5;

export function useFlashcards() {
  const [decks, setDecks] = useLocalStorage<FlashcardDeck[]>(
    "studyos_flashcard_decks",
    []
  );
  const [studyHistory, setStudyHistory] = useLocalStorage<
    Record<string, number>
  >("studyos_srs_history", {});

  // Crear nuevo deck
  const createDeck = useCallback(
    (name: string, subjectId: string, description?: string): FlashcardDeck => {
      const newDeck: FlashcardDeck = {
        id: `deck_${Date.now()}`,
        name,
        subjectId,
        description,
        cards: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDecks([...decks, newDeck]);
      return newDeck;
    },
    [decks, setDecks]
  );

  // Añadir flashcard a deck
  const addCardToDeck = useCallback(
    (deckId: string, question: string, answer: string, subjectId?: string) => {
      const card: Flashcard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question,
        answer,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewDate: new Date().toISOString().split("T")[0],
        subjectId,
      };

      setDecks(
        decks.map(deck => {
          if (deck.id === deckId) {
            return {
              ...deck,
              cards: [...deck.cards, card],
              updatedAt: new Date().toISOString(),
            };
          }
          return deck;
        })
      );

      return card;
    },
    [decks, setDecks]
  );

  // Añadir múltiples cards a deck
  const addCardsToDeck = useCallback(
    (deckId: string, cards: { question: string; answer: string }[]) => {
      const newCards: Flashcard[] = cards.map((c, i) => ({
        id: `card_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        question: c.question,
        answer: c.answer,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewDate: new Date().toISOString().split("T")[0],
      }));

      setDecks(
        decks.map(deck => {
          if (deck.id === deckId) {
            return {
              ...deck,
              cards: [...deck.cards, ...newCards],
              updatedAt: new Date().toISOString(),
            };
          }
          return deck;
        })
      );

      return newCards;
    },
    [decks, setDecks]
  );

  // Eliminar deck
  const deleteDeck = useCallback(
    (deckId: string) => {
      setDecks(decks.filter(d => d.id !== deckId));
    },
    [decks, setDecks]
  );

  // Eliminar card de deck
  const deleteCard = useCallback(
    (deckId: string, cardId: string) => {
      setDecks(
        decks.map(deck => {
          if (deck.id === deckId) {
            return {
              ...deck,
              cards: deck.cards.filter(c => c.id !== cardId),
              updatedAt: new Date().toISOString(),
            };
          }
          return deck;
        })
      );
    },
    [decks, setDecks]
  );

  // Actualizar flashcard
  const updateCard = useCallback(
    (deckId: string, cardId: string, updates: Partial<Flashcard>) => {
      setDecks(
        decks.map(deck => {
          if (deck.id === deckId) {
            return {
              ...deck,
              cards: deck.cards.map(card =>
                card.id === cardId ? { ...card, ...updates } : card
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return deck;
        })
      );
    },
    [decks, setDecks]
  );

  // Algoritmo SM-2 simplificado para SRS
  // quality: 0-5 (0=fallo total, 5=respuesta perfecta)
  const calculateNextReview = useCallback(
    (card: Flashcard, quality: SRSQuality): Partial<Flashcard> => {
      let { easeFactor, interval, repetitions } = card;
      const today = new Date();

      if (quality < 3) {
        // Fallo - reiniciar
        repetitions = 0;
        interval = 1;
      } else {
        // Éxito
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
      }

      // Actualizar ease factor
      easeFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );

      // Calcular próxima fecha
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + interval);

      return {
        easeFactor,
        interval,
        repetitions,
        nextReviewDate: nextDate.toISOString().split("T")[0],
        lastReviewDate: today.toISOString().split("T")[0],
        totalReviews: card.totalReviews + 1,
        correctReviews:
          quality >= 3 ? card.correctReviews + 1 : card.correctReviews,
      };
    },
    []
  );

  // Revisar una card
  const reviewCard = useCallback(
    (deckId: string, cardId: string, quality: SRSQuality) => {
      const deck = decks.find(d => d.id === deckId);
      if (!deck) return 0;

      const card = deck.cards.find(c => c.id === cardId);
      if (!card) return 0;

      const updates = calculateNextReview(card, quality);
      updateCard(deckId, cardId, updates);

      // XP basado en calidad
      const xpEarned =
        quality >= 4
          ? XP_REWARDS.CARD_REVIEWED + 2
          : quality >= 3
            ? XP_REWARDS.CARD_REVIEWED
            : Math.floor(XP_REWARDS.CARD_REVIEWED / 2);

      return xpEarned;
    },
    [decks, calculateNextReview, updateCard]
  );

  // Obtener cards para estudiar hoy
  const getCardsForToday = useCallback(
    (deckId?: string) => {
      const today = new Date().toISOString().split("T")[0];

      return decks
        .filter(d => !deckId || d.id === deckId)
        .flatMap(deck =>
          deck.cards
            .filter(card => card.nextReviewDate <= today)
            .map(card => ({ ...card, deckId: deck.id, deckName: deck.name }))
        );
    },
    [decks]
  );

  // Obtener deck por ID
  const getDeck = useCallback(
    (deckId: string) => {
      return decks.find(d => d.id === deckId);
    },
    [decks]
  );

  // Estadísticas
  const stats = useMemo(() => {
    const allCards = decks.flatMap(d => d.cards);
    const today = new Date().toISOString().split("T")[0];

    const dueToday = allCards.filter(c => c.nextReviewDate <= today).length;
    const newCards = allCards.filter(c => c.totalReviews === 0).length;
    const mastered = allCards.filter(c => c.interval >= 21).length;
    const learning = allCards.filter(
      c => c.interval < 21 && c.totalReviews > 0
    ).length;

    const totalReviews = allCards.reduce((sum, c) => sum + c.totalReviews, 0);
    const totalCorrect = allCards.reduce((sum, c) => sum + c.correctReviews, 0);
    const accuracy =
      totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    return {
      totalDecks: decks.length,
      totalCards: allCards.length,
      dueToday,
      newCards,
      learning,
      mastered,
      accuracy,
      totalReviews,
    };
  }, [decks]);

  return {
    decks,
    createDeck,
    addCardToDeck,
    addCardsToDeck,
    deleteDeck,
    deleteCard,
    updateCard,
    reviewCard,
    getCardsForToday,
    getDeck,
    stats,
    XP_REWARDS,
  };
}
