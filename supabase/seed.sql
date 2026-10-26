-- ==============================================================================
-- 🐮💪 MOOSCLES SEED DATA
-- ==============================================================================

-- 1. Membres initiaux du groupe Mooscles
INSERT INTO public.profiles (id, name, avatar, color, role) VALUES
  ('u1', 'David (Moi)', '🐮', '#f59e0b', 'admin'),
  ('u2', 'Alexandre', '🦍', '#3b82f6', 'member'),
  ('u3', 'Lucas', '🦁', '#10b981', 'member'),
  ('u4', 'Thomas', '🐺', '#8b5cf6', 'member'),
  ('u5', 'Sarah', '🦊', '#ec4899', 'member'),
  ('u6', 'Maxime', '🐻', '#06b6d4', 'member'),
  ('u7', 'Clément', '🦅', '#f97316', 'member')
ON CONFLICT (id) DO NOTHING;

-- 2. Clôture de la Semaine 1 (19 - 25 Octobre)
INSERT INTO public.weekly_settlements (user_id, week_number, year, score, fine_amount, is_paid, paid_at) VALUES
  ('u1', 1, 2026, 4, 1.00, true, '2026-10-26 09:00:00+00'),
  ('u2', 1, 2026, 5, 0.00, true, '2026-10-26 09:00:00+00'),
  ('u3', 1, 2026, 1, 4.00, false, null),
  ('u4', 1, 2026, 3, 2.00, true, '2026-10-26 10:00:00+00'),
  ('u5', 1, 2026, 2, 3.00, false, null),
  ('u6', 1, 2026, 4, 1.00, false, null),
  ('u7', 1, 2026, 0, 5.00, false, null)
ON CONFLICT (user_id, week_number, year) DO NOTHING;

-- 3. Idées initiales pour la cagnotte
INSERT INTO public.cagnotte_ideas (id, title, description, suggested_by, votes) VALUES
  ('i1', 'Festin Viande & Barbecue Géant 🥩🔥', 'On privatise un spot ou on se fait une grosse soirée grillades avec la cagnotte.', 'u1', '["u1", "u2", "u4"]'::jsonb),
  ('i2', 'Session Grand Prix Karting 🏎️💨', 'Course de karting indoor entre nous pour décrasser les cuisses !', 'u3', '["u3", "u6", "u7"]'::jsonb),
  ('i3', 'Grand Resto Étoilé ou Bistronomique 🍷🍽️', 'Tout le monde sur son 31 pour fêter la fin du challenge.', 'u5', '["u5", "u1"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
