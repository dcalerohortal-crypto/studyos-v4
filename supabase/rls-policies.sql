-- StudyOS RLS Policies for Supabase
-- Run this SQL in your Supabase SQL Editor to enable row-level security

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- NOTEBOOKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notebooks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📚',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notebooks
CREATE POLICY "Users can view own notebooks"
ON public.notebooks FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can only update their own notebooks
CREATE POLICY "Users can update own notebooks"
ON public.notebooks FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Users can only insert notebooks
CREATE POLICY "Users can insert notebooks"
ON public.notebooks FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own notebooks
CREATE POLICY "Users can delete own notebooks"
ON public.notebooks FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- MEMORY (NOTES) TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.memory (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  notebook_id TEXT REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'note',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own memory
CREATE POLICY "Users can view own memory"
ON public.memory FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can only update their own memory
CREATE POLICY "Users can update own memory"
ON public.memory FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Users can only insert memory
CREATE POLICY "Users can insert memory"
ON public.memory FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own memory
CREATE POLICY "Users can delete own memory"
ON public.memory FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- SUBJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📖',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subjects
CREATE POLICY "Users can view own subjects"
ON public.subjects FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can only update their own subjects
CREATE POLICY "Users can update own subjects"
ON public.subjects FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Users can only insert subjects
CREATE POLICY "Users can insert subjects"
ON public.subjects FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own subjects
CREATE POLICY "Users can delete own subjects"
ON public.subjects FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- CALENDAR EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  notebook_id TEXT REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT DEFAULT 'exam',
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own events
CREATE POLICY "Users can view own events"
ON public.events FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can only update their own events
CREATE POLICY "Users can update own events"
ON public.events FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Users can only insert events
CREATE POLICY "Users can insert events"
ON public.events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own events
CREATE POLICY "Users can delete own events"
ON public.events FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  subject_id TEXT,
  notebook_id TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own activity
CREATE POLICY "Users can view own activity"
ON public.activity_log FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can only insert activity
CREATE POLICY "Users can insert activity"
ON public.activity_log FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================
-- USER PROGRESS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_progress (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own progress
CREATE POLICY "Users can view own progress"
ON public.user_progress FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can only update their own progress
CREATE POLICY "Users can update own progress"
ON public.user_progress FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Users can only insert their own progress
CREATE POLICY "Users can insert own progress"
ON public.user_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON public.notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_user_id ON public.memory(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_notebook_id ON public.memory(notebook_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON public.activity_log(timestamp DESC);

-- ============================================
-- USER ROUTINES TABLE (Misión 1)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('deporte', 'estudio', 'salud', 'mente')),
  xp_reward INTEGER DEFAULT 50,
  schedule JSONB DEFAULT '{"recurrence": "daily", "time": "09:00"}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own routines"
ON public.user_routines FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role access routines"
ON public.user_routines FOR ALL
USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON public.user_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_category ON public.user_routines(category);
CREATE INDEX IF NOT EXISTS idx_routines_active ON public.user_routines(is_active) WHERE is_active = TRUE;

-- ============================================
-- LIFE TRACKER TABLE (Misión 1)
-- ============================================

CREATE TABLE IF NOT EXISTS public.life_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  metrics JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.life_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tracker"
ON public.life_tracker FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role access tracker"
ON public.life_tracker FOR ALL
USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_life_tracker_user_date ON public.life_tracker(user_id, date DESC);