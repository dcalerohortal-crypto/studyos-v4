-- StudyOS Notebooks Migration
-- Adds missing columns to the notebooks table for full notebook data storage
-- Run this in Supabase SQL Editor

-- Add description column
ALTER TABLE public.notebooks ADD COLUMN IF NOT EXISTS description TEXT;

-- Add documents as JSONB (stores document metadata and base64 data)
ALTER TABLE public.notebooks ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Add generated_content as JSONB (stores AI-generated summaries, flashcards, tests, etc.)
ALTER TABLE public.notebooks ADD COLUMN IF NOT EXISTS generated_content JSONB DEFAULT '[]'::jsonb;

-- Add url_sources as JSONB (stores YouTube and URL sources)
ALTER TABLE public.notebooks ADD COLUMN IF NOT EXISTS url_sources JSONB DEFAULT '[]'::jsonb;

-- Add chat_history as JSONB 
ALTER TABLE public.notebooks ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb;

-- Update the updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notebooks_updated_at ON public.notebooks;
CREATE TRIGGER update_notebooks_updated_at
    BEFORE UPDATE ON public.notebooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
