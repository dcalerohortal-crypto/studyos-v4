export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// StudyOS v3 - Constantes de Dominio
export const SUBJECTS = [
  { id: 'matematicas', nombre: 'Matemáticas', color: '#3B82F6', icon: 'target' },
  { id: 'fisica', nombre: 'Física', color: '#8B5CF6', icon: 'zap' },
  { id: 'quimica', nombre: 'Química', color: '#10B981', icon: 'flask' },
  { id: 'lengua', nombre: 'Lengua', color: '#F59E0B', icon: 'book' },
  { id: 'ingles', nombre: 'Inglés', color: '#EF4444', icon: 'mail' },
  { id: 'historia', nombre: 'Historia', color: '#EC4899', icon: 'compass' },
] as const;

export const DAILY_CHALLENGES = [
  { id: 'deporte', label: 'Deporte', icon: 'activity', color: '#EF4444' },
  { id: 'estudio', label: 'Estudio', icon: 'book', color: '#3B82F6' },
  { id: 'salud', label: 'Salud', icon: 'heart', color: '#10B981' },
  { id: 'mente', label: 'Mente', icon: 'brain', color: '#F59E0B' },
] as const;

export const XP_REWARDS = {
  CHALLENGE_COMPLETE: 100,
  HABIT_COMPLETE: 50,
  STUDY_SESSION: 75,
  LEVEL_UP: 0,
} as const;

export const LEVEL_UP_THRESHOLD = 300;
