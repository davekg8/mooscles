-- ==============================================================================
-- 🐮💪 MOOSCLES DATABASE SCHEMA (Supabase PostgreSQL)
-- Challenge Sportif : 19 Octobre - 17 Décembre
-- Règle : 250 Pompes, 250 Squats, 10 min de Gainage par semaine (score sur 5)
-- ==============================================================================

-- 1. Table des profils utilisateurs / membres du groupe
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🐮',
  color TEXT NOT NULL DEFAULT '#f59e0b',
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' ou 'member'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des entrées quotidiennes (saisie des répétitions et gainage)
CREATE TABLE IF NOT EXISTS public.daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pushups INTEGER NOT NULL DEFAULT 0 CHECK (pushups >= 0),
  squats INTEGER NOT NULL DEFAULT 0 CHECK (squats >= 0),
  plank_seconds INTEGER NOT NULL DEFAULT 0 CHECK (plank_seconds >= 0),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. Table des clôtures hebdomadaires & comptes des amendes
CREATE TABLE IF NOT EXISTS public.weekly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 9),
  year INTEGER NOT NULL DEFAULT 2026,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 5),
  fine_amount NUMERIC(4, 2) NOT NULL CHECK (fine_amount BETWEEN 0 AND 5),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  confirmed_by_user BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number, year)
);

-- 4. Table des idées & votes pour la dépense de la cagnotte
CREATE TABLE IF NOT EXISTS public.cagnotte_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  suggested_by TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  votes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de user_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON public.daily_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_settlements_week ON public.weekly_settlements(week_number);

-- Activation de RLS (Row Level Security) avec accès en lecture/écriture pour le groupe
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cagnotte_ideas ENABLE ROW LEVEL SECURITY;

-- Politiques RLS permissives pour le groupe d'amis
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public write profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Public read daily_entries" ON public.daily_entries FOR SELECT USING (true);
CREATE POLICY "Public write daily_entries" ON public.daily_entries FOR ALL USING (true);

CREATE POLICY "Public read settlements" ON public.weekly_settlements FOR SELECT USING (true);
CREATE POLICY "Public write settlements" ON public.weekly_settlements FOR ALL USING (true);

CREATE POLICY "Public read ideas" ON public.cagnotte_ideas FOR SELECT USING (true);
CREATE POLICY "Public write ideas" ON public.cagnotte_ideas FOR ALL USING (true);

-- Insertion des 7 membres initiaux du groupe Mooscles
INSERT INTO public.profiles (id, name, avatar, color, role) VALUES
  ('u1', 'David (Moi)', '🐮', '#f59e0b', 'admin'),
  ('u2', 'Alexandre', '🦍', '#3b82f6', 'member'),
  ('u3', 'Lucas', '🦁', '#10b981', 'member'),
  ('u4', 'Thomas', '🐺', '#8b5cf6', 'member'),
  ('u5', 'Sarah', '🦊', '#ec4899', 'member'),
  ('u6', 'Maxime', '🐻', '#06b6d4', 'member'),
  ('u7', 'Clément', '🦅', '#f97316', 'member')
ON CONFLICT (id) DO NOTHING;
