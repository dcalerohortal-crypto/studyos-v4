// StudyOS v3 - Type Definitions

export interface UserProfile {
  nombre: string;
  curso: string;
  xpTotal: number;
  nivel: number;
  racha: number;
  createdAt: string;
}

export interface SubjectXP {
  id: string;
  xp_total: number;
  xp_en_nivel: number;
  nivel: number;
  lastUpdated: string;
}

export interface Habit {
  id: string;
  nombre: string;
  categoria: "deporte" | "estudio" | "salud" | "mente";
  completedDates: string[];
  createdAt: string;
}

export interface DailyChallenge {
  id: string;
  categoria: "deporte" | "estudio" | "salud" | "mente";
  descripcion: string;
  xpReward: number;
  completedToday: boolean;
}

export interface Rutina {
  id: string;
  nombre: string;
  tipo: "deporte" | "estudio" | "salud" | "mente";
  pasos: string[];
  duracion: string;
  metodologia: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AIResponse {
  success: boolean;
  text?: string;
  rutina?: Rutina | null;
  error?: string;
}

export interface ActivityLog {
  tipo: "xp" | "level" | "challenge" | "habit";
  texto: string;
  timestamp: string;
  xpGanado?: number;
}

// Archivo de documento en un cuaderno
export interface NotebookDocument {
  id: string;
  name: string;
  type: "pdf" | "image" | "text" | "document";
  fileUrl?: string;
  fileData?: string; // Base64
  uploadedAt: string;
  size: number;
}

// Cuaderno (Notebook) - Similar a NotebookLM
export interface Notebook {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  documents: NotebookDocument[];
  chatHistory: ChatMessage[];
  generatedContent: GeneratedContent[];
  urlSources?: URLSource[];
  createdAt: string;
  updatedAt: string;
}

// Fuente de contenido web (YouTube, URLs, etc.)
export interface URLSource {
  id: string;
  type: "youtube" | "url";
  name: string;
  url: string;
  addedAt: string;
}

// Contenido generado por la IA
export interface GeneratedContent {
  id: string;
  type: "summary" | "flashcards" | "mindmap" | "podcast" | "test";
  title: string;
  content: any;
  createdAt: string;
}

// Flashcard individual con SRS (Spaced Repetition)
export interface Flashcard {
  front: string; // Question
  back: string; // Answer
}

// Deck de flashcards
export interface FlashcardDeck {
  id: string;
  name: string;
  subjectId: string;
  description?: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

// Test interactivo
export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Test {
  id: string;
  title: string;
  questions: TestQuestion[];
  timeLimit?: number;
}

// Esquema/Mindmap Interactivo
export interface MindmapNode {
  id: string;
  titulo: string;
  contenido: string;
  hijos?: MindmapNode[];
}

export interface MindmapState {
  expandedNodes: Set<string>;
}

export interface InteractiveMindmap {
  titulo: string;
  contenido: string;
  hijos: MindmapNode[];
}

// Podcast
export interface Podcast {
  id: string;
  title: string;
  audioUrl?: string;
  transcript: string;
  duration: number;
}

export interface PodcastSegment {
  speaker: "host1" | "host2";
  text: string;
}

export interface PodcastScript {
  segments: PodcastSegment[];
}

// Structured Summary (new format)
export interface StructuredSummary {
  idea_central: string;
  conceptos: {
    titulo: string;
    explicacion: string;
    ejemplo: string;
  }[];
  conexion_final: string;
}

// ====== SISTEMA DE XP LOCAL DEL CUADERNO ======

// Logros
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  xpBonus: number;
}

// Sesión de estudio
export interface StudySession {
  date: string;
  contentViewed: string[];
  testCorrect: number;
  testTotal: number;
  pomodorosCompleted: number;
  xpEarned: number;
}

// XP local del cuaderno
export interface NotebookXP {
  notebookId: string;
  xp: number;
  level: number;
  achievements: Achievement[];
  studyHistory: StudySession[];
  streakCount: number;
  lastStudyDate: string;
}

// Niveles locales
export const NOTEBOOK_LEVELS = [
  { level: 1, xpRequired: 0, title: "Principiante" },
  { level: 2, xpRequired: 50, title: "Aprendiendo" },
  { level: 3, xpRequired: 150, title: "En Progreso" },
  { level: 4, xpRequired: 300, title: "Avanzado" },
  { level: 5, xpRequired: 500, title: "Dominado" },
];

// Logros disponibles
export const ACHIEVEMENTS = [
  {
    id: "first_test",
    name: "Primera",
    description: "Primer test superado",
    icon: "🏆",
    xpBonus: 10,
  },
  {
    id: "streak_5",
    name: "Racha 5",
    description: "5 respuestas seguidas",
    icon: "🔥",
    xpBonus: 15,
  },
  {
    id: "pomodoros_3",
    name: "Pomodoro Master",
    description: "3 Pomodoros seguidos",
    icon: "🍅",
    xpBonus: 20,
  },
  {
    id: "rest_earned",
    name: "Descansito Ganado",
    description: "100 XP en una sesión",
    icon: "☕",
    xpBonus: 10,
  },
  {
    id: "marathon",
    name: "Maratonista",
    description: "30 min de estudio",
    icon: "📚",
    xpBonus: 25,
  },
  {
    id: "topic_master",
    name: "Tema Dominado",
    description: "Alcanza nivel 5",
    icon: "🎓",
    xpBonus: 50,
  },
];

// XP Awards
export const XP_AWARDS = {
  TEST_CORRECT: 5,
  TEST_STREAK_BONUS: 15,
  TEST_COMPLETE: 20,
  SUMMARY_READ: 10,
  NOTE_CREATED: 3,
  POMODORO_COMPLETE: 10,
  POMODORO_STREAK_BONUS: 20,
  VISIT_CARD: 1,
};

// ====== SISTEMA POMODORO ======

export type PomodoroState = "idle" | "running" | "paused" | "break";

export interface PomodoroSettings {
  studyMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

// ====== TUTOR IA VISUAL ======

export type PhysicsSimulationType = "urm" | "ucm" | "centripetal";

export interface SimulationParams {
  // URM params
  velocidadInicial?: number;
  posicionInicial?: number;
  aceleracion?: number;
  tiempoActual?: number;

  // UCM params
  radio?: number;
  velocidadAngular?: number;
  periodo?: number;
  anguloActual?: number;

  // Centripetal params
  masa?: number;
  velocidadLineal?: number;
  mostrarVectores?: boolean;
  mostrarFuerza?: boolean;
}

export interface PhysicsSimulation {
  tipo: PhysicsSimulationType;
  titulo: string;
  descripcion: string;
  parametros: SimulationParams;
  ecuaciones: string[];
}

export interface VisualStep {
  id: string;
  titulo: string;
  explicacion: string;
  formula?: string;
  simulacion?: PhysicsSimulation;
  destacarParametro?: string;
  esperandoConfirmacion: boolean;
}

export interface TutorMessage {
  id: string;
  rol: "ai" | "usuario";
  contenido: string;
  pasos?: VisualStep[];
  pasoActual?: number;
  timestamp: string;
}

export interface TutorSession {
  cuadernoId: string;
  tema: string;
  mensajes: TutorMessage[];
  pasoActual: number;
  contexto: string;
  startedAt: string;
}
